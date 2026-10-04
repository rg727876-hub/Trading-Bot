import { Decimal } from 'decimal.js';

import { calculateMaximumDrawdown } from '../analytics/drawdown.js';
import { calculatePerformanceMetrics, type PerformanceMetrics } from '../analytics/metrics.js';
import {
  PaperTradingEngine,
  type PaperTrade,
  type PaperTradingConfig,
} from '../execution/paper-trading.js';
import type { Candle } from '../market/candle.js';
import {
  calculateFixedPercentageStopLoss,
  calculateRiskRewardTakeProfit,
} from '../risk/protective-prices.js';
import { calculatePositionSize } from '../risk/position-sizing.js';
import { RiskManager } from '../risk/risk-manager.js';
import type { Strategy } from '../strategies/strategy.js';

export interface BacktestConfig extends PaperTradingConfig {
  maxOpenPositions: number;
  riskPerTrade: Decimal.Value;
  riskReward: Decimal.Value;
  stopLossPercentage: Decimal.Value;
}

export interface BacktestResult {
  equityCurve: Decimal[];
  finalBalance: Decimal;
  initialBalance: Decimal;
  maxDrawdown: Decimal;
  metrics: PerformanceMetrics;
  trades: readonly PaperTrade[];
}

export class BacktestDataError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'BacktestDataError';
  }
}

/**
 * Evaluates signals from prior candles and executes only on the next candle's
 * opening price. This makes future candle data unavailable to strategy logic.
 */
export class BacktestEngine {
  private readonly config: BacktestConfig;
  private readonly riskManager: RiskManager;

  public constructor(
    private readonly strategy: Strategy,
    config: BacktestConfig,
  ) {
    this.config = config;
    this.riskManager = new RiskManager({
      maxOpenPositions: config.maxOpenPositions,
      riskPerTrade: config.riskPerTrade,
    });
  }

  public run(candles: readonly Candle[]): BacktestResult {
    assertValidDataset(candles);
    const paper = new PaperTradingEngine(this.config);
    const equityCurve: Decimal[] = [];

    for (let index = 0; index < candles.length; index += 1) {
      const candle = candles[index] as Candle;
      const protectiveExit = paper.processCandle(candle);
      if (protectiveExit !== undefined) {
        equityCurve.push(paper.balance);
        continue;
      }

      if (index > 0) {
        const signal = this.strategy.evaluate(candles.slice(0, index));
        if (signal.action === 'SELL' && paper.position !== undefined) {
          paper.closePosition({
            price: candle.open,
            reason: 'SIGNAL',
            timestamp: candle.timestamp,
          });
        }
        if (signal.action === 'BUY' && paper.position === undefined) {
          this.openRiskApprovedPosition(paper, signal, candle);
        }
      }

      equityCurve.push(calculateEquity(paper, candle));
    }

    const finalCandle = candles[candles.length - 1];
    if (paper.position !== undefined && finalCandle !== undefined) {
      paper.closePosition({
        price: finalCandle.close,
        reason: 'BACKTEST_END',
        timestamp: finalCandle.timestamp,
      });
      equityCurve.push(paper.balance);
    }

    const trades = paper.trades;
    return {
      equityCurve,
      finalBalance: paper.balance,
      initialBalance: new Decimal(this.config.initialBalance),
      maxDrawdown: calculateMaximumDrawdown(equityCurve),
      metrics: calculatePerformanceMetrics(trades),
      trades,
    };
  }

  private openRiskApprovedPosition(
    paper: PaperTradingEngine,
    signal: ReturnType<Strategy['evaluate']>,
    candle: Candle,
  ): void {
    const stopLoss = calculateFixedPercentageStopLoss({
      entryPrice: candle.open,
      percentage: this.config.stopLossPercentage,
      side: 'BUY',
    });
    const takeProfit = calculateRiskRewardTakeProfit({
      entryPrice: candle.open,
      riskReward: this.config.riskReward,
      side: 'BUY',
      stopLoss,
    });
    const quantity = calculatePositionSize({
      capital: paper.balance,
      entryPrice: candle.open,
      riskPerTrade: this.config.riskPerTrade,
      stopLoss,
    });
    const validation = this.riskManager.validate({
      availableBalance: paper.balance,
      botStatus: 'RUNNING',
      entryPrice: candle.open,
      openPositions: paper.openPositionCount,
      quantity,
      signal,
      stopLoss,
    });

    if (!validation.approved) return;
    paper.openPosition({
      entryPrice: candle.open,
      quantity,
      stopLoss,
      symbol: signal.symbol,
      takeProfit,
      timestamp: candle.timestamp,
    });
  }
}

function assertValidDataset(candles: readonly Candle[]): void {
  for (let index = 1; index < candles.length; index += 1) {
    const previous = candles[index - 1] as Candle;
    const current = candles[index] as Candle;
    if (current.timestamp.getTime() <= previous.timestamp.getTime()) {
      throw new BacktestDataError('Backtest candles must be strictly chronological.');
    }
    if (current.symbol !== previous.symbol || current.timeframe !== previous.timeframe) {
      throw new BacktestDataError('Backtest candles must belong to one market and timeframe.');
    }
  }
}

function calculateEquity(paper: PaperTradingEngine, candle: Candle): Decimal {
  const position = paper.position;
  return position === undefined
    ? paper.balance
    : paper.balance.plus(position.quantity.mul(candle.close));
}
