import { describe, expect, it } from 'vitest';

import { BacktestDataError, BacktestEngine } from '../../src/backtesting/backtest-engine.js';
import type { Signal, Strategy } from '../../src/strategies/strategy.js';
import { createCandle } from '../../src/market/candle.js';

const candle = (hour: number, close = 100, low = close - 1, high = close + 1) =>
  createCandle({
    close: close.toString(),
    high: high.toString(),
    low: low.toString(),
    open: close.toString(),
    symbol: 'BTCUSDT',
    timeframe: '1h',
    timestamp: new Date(Date.UTC(2026, 0, 1, hour)),
    volume: '1',
  });

class RecordingStrategy implements Strategy {
  public readonly seenHistoryLengths: number[] = [];

  public evaluate(candles: readonly ReturnType<typeof candle>[]): Signal {
    this.seenHistoryLengths.push(candles.length);
    const latest = candles[candles.length - 1] as ReturnType<typeof candle>;
    return { action: 'BUY', metadata: {}, symbol: latest.symbol, timestamp: latest.timestamp };
  }
}

describe('BacktestEngine', () => {
  const config = {
    feeRate: '0',
    initialBalance: '1000',
    maxOpenPositions: 1,
    riskPerTrade: '0.01',
    riskReward: '2',
    stopLossPercentage: '0.05',
  };

  it('does not expose the current or future candle to strategy evaluation', () => {
    const strategy = new RecordingStrategy();
    const result = new BacktestEngine(strategy, config).run([candle(0), candle(1), candle(2)]);

    expect(strategy.seenHistoryLengths).toEqual([1, 2]);
    expect(result.trades).toHaveLength(1);
  });

  it('closes an opened position at stop loss on a later candle and records metrics', () => {
    const strategy = new RecordingStrategy();
    const result = new BacktestEngine(strategy, config).run([
      candle(0),
      candle(1, 100),
      candle(2, 96, 94, 97),
    ]);

    expect(result.trades[0]).toMatchObject({ exitReason: 'STOP_LOSS' });
    expect(result.metrics.netPnl.toString()).toBe('-10');
    expect(result.finalBalance.toString()).toBe('990');
  });

  it('returns an empty result for an empty dataset', () => {
    const result = new BacktestEngine(new RecordingStrategy(), config).run([]);

    expect(result.trades).toEqual([]);
    expect(result.finalBalance.toString()).toBe('1000');
  });

  it('rejects chronologically invalid input', () => {
    expect(() =>
      new BacktestEngine(new RecordingStrategy(), config).run([candle(1), candle(0)]),
    ).toThrow(BacktestDataError);
  });
});
