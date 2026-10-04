import { Decimal } from 'decimal.js';

import type { Candle } from '../market/candle.js';
import { TradeStateMachine, type TradeState } from './trade-state-machine.js';

export type PaperTradeExitReason = 'SIGNAL' | 'STOP_LOSS' | 'TAKE_PROFIT' | 'BACKTEST_END';

export interface PaperTradingConfig {
  feeRate: Decimal.Value;
  initialBalance: Decimal.Value;
}

export interface OpenPaperPositionInput {
  entryPrice: Decimal.Value;
  quantity: Decimal.Value;
  stopLoss: Decimal.Value;
  symbol: string;
  takeProfit: Decimal.Value;
  timestamp: Date;
}

export interface ClosePaperPositionInput {
  price: Decimal.Value;
  reason: PaperTradeExitReason;
  timestamp: Date;
}

export interface PaperPosition {
  entryFee: Decimal;
  entryPrice: Decimal;
  id: string;
  openedAt: Date;
  quantity: Decimal;
  status: 'OPEN';
  stopLoss: Decimal;
  symbol: string;
  takeProfit: Decimal;
}

export interface PaperTrade {
  entryPrice: Decimal;
  entryTime: Date;
  exitPrice: Decimal;
  exitReason: PaperTradeExitReason;
  exitTime: Date;
  fees: Decimal;
  id: string;
  profitLoss: Decimal;
  quantity: Decimal;
  status: 'CLOSED';
  symbol: string;
}

export class PaperTradingError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'PaperTradingError';
  }
}

/**
 * A deterministic, cash-only paper-trading ledger. It cannot communicate with
 * an exchange and supports one long spot position in V1.
 */
export class PaperTradingEngine {
  private readonly feeRate: Decimal;
  private readonly lifecycle = new TradeStateMachine();
  private readonly tradeHistory: PaperTrade[] = [];
  private activePosition: PaperPosition | undefined;
  private availableBalance: Decimal;
  private nextId = 1;

  public constructor(config: PaperTradingConfig) {
    try {
      this.availableBalance = new Decimal(config.initialBalance);
      this.feeRate = new Decimal(config.feeRate);
    } catch {
      throw new PaperTradingError('Paper trading configuration values must be valid decimals.');
    }
    if (this.availableBalance.lt(0) || this.feeRate.lt(0)) {
      throw new PaperTradingError('Initial balance and fee rate cannot be negative.');
    }
  }

  public get balance(): Decimal {
    return this.availableBalance;
  }

  public get openPositionCount(): number {
    return this.activePosition === undefined ? 0 : 1;
  }

  public get position(): PaperPosition | undefined {
    return this.activePosition;
  }

  public get state(): TradeState {
    return this.lifecycle.current;
  }

  public get trades(): readonly PaperTrade[] {
    return this.tradeHistory;
  }

  public openPosition(input: OpenPaperPositionInput): PaperPosition {
    if (this.activePosition !== undefined) {
      throw new PaperTradingError('A compatible paper position is already open.');
    }

    const values = parseOpenInput(input);
    const entryFee = values.entryPrice.mul(values.quantity).mul(this.feeRate);
    const requiredBalance = values.entryPrice.mul(values.quantity).plus(entryFee);
    if (requiredBalance.gt(this.availableBalance)) {
      throw new PaperTradingError('Insufficient virtual balance for this paper position.');
    }

    this.lifecycle.transition('SIGNAL_DETECTED');
    this.lifecycle.transition('RISK_VALIDATION');
    this.lifecycle.transition('OPENING');

    const position: PaperPosition = {
      entryFee,
      entryPrice: values.entryPrice,
      id: this.createId('position'),
      openedAt: input.timestamp,
      quantity: values.quantity,
      status: 'OPEN',
      stopLoss: values.stopLoss,
      symbol: input.symbol.trim(),
      takeProfit: values.takeProfit,
    };
    this.availableBalance = this.availableBalance.minus(requiredBalance);
    this.activePosition = position;
    this.lifecycle.transition('OPEN');
    return position;
  }

  public closePosition(input: ClosePaperPositionInput): PaperTrade {
    const position = this.activePosition;
    if (position === undefined) {
      throw new PaperTradingError('No paper position is available to close.');
    }

    const exitPrice = parsePositiveDecimal(input.price, 'Exit price');
    this.lifecycle.transition('CLOSING');
    const exitFee = exitPrice.mul(position.quantity).mul(this.feeRate);
    const grossProfitLoss = exitPrice.minus(position.entryPrice).mul(position.quantity);
    const trade: PaperTrade = {
      entryPrice: position.entryPrice,
      entryTime: position.openedAt,
      exitPrice,
      exitReason: input.reason,
      exitTime: input.timestamp,
      fees: position.entryFee.plus(exitFee),
      id: this.createId('trade'),
      profitLoss: grossProfitLoss.minus(position.entryFee).minus(exitFee),
      quantity: position.quantity,
      status: 'CLOSED',
      symbol: position.symbol,
    };

    this.availableBalance = this.availableBalance.plus(
      exitPrice.mul(position.quantity).minus(exitFee),
    );
    this.activePosition = undefined;
    this.tradeHistory.push(trade);
    this.lifecycle.transition('CLOSED');
    this.lifecycle.transition('NO_POSITION');
    return trade;
  }

  public processCandle(candle: Candle): PaperTrade | undefined {
    const position = this.activePosition;
    if (position === undefined || candle.symbol !== position.symbol) {
      return undefined;
    }

    // With only OHLC data, an intrabar order is unknowable; stop-first is conservative.
    if (candle.low.lte(position.stopLoss)) {
      return this.closePosition({
        price: position.stopLoss,
        reason: 'STOP_LOSS',
        timestamp: candle.timestamp,
      });
    }
    if (candle.high.gte(position.takeProfit)) {
      return this.closePosition({
        price: position.takeProfit,
        reason: 'TAKE_PROFIT',
        timestamp: candle.timestamp,
      });
    }
    return undefined;
  }

  private createId(prefix: string): string {
    const id = `${prefix}-${this.nextId}`;
    this.nextId += 1;
    return id;
  }
}

function parseOpenInput(input: OpenPaperPositionInput) {
  if (!input.symbol.trim() || Number.isNaN(input.timestamp.getTime())) {
    throw new PaperTradingError('Paper position requires a symbol and valid timestamp.');
  }

  const entryPrice = parsePositiveDecimal(input.entryPrice, 'Entry price');
  const quantity = parsePositiveDecimal(input.quantity, 'Quantity');
  const stopLoss = parsePositiveDecimal(input.stopLoss, 'Stop loss');
  const takeProfit = parsePositiveDecimal(input.takeProfit, 'Take profit');
  if (stopLoss.gte(entryPrice) || takeProfit.lte(entryPrice)) {
    throw new PaperTradingError('Protective prices must bracket the entry price.');
  }
  return { entryPrice, quantity, stopLoss, takeProfit };
}

function parsePositiveDecimal(value: Decimal.Value, label: string): Decimal {
  try {
    const decimal = new Decimal(value);
    if (decimal.lte(0)) throw new PaperTradingError(`${label} must be greater than zero.`);
    return decimal;
  } catch (error) {
    if (error instanceof PaperTradingError) throw error;
    throw new PaperTradingError(`${label} must be a valid decimal.`);
  }
}
