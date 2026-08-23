import { describe, expect, it } from 'vitest';

import {
  EmaRsiMacdStrategy,
  StrategyInputError,
} from '../../src/strategies/ema-rsi-macd.strategy.js';
import { createCandle } from '../../src/market/candle.js';

const candlesFromCloses = (closes: readonly number[], symbol = 'BTCUSDT') =>
  closes.map((close, index) =>
    createCandle({
      close: close.toString(),
      high: (close + 1).toString(),
      low: (close - 1).toString(),
      open: close.toString(),
      symbol,
      timeframe: '1h',
      timestamp: new Date(Date.UTC(2026, 0, 1, index)),
      volume: '10',
    }),
  );

describe('EmaRsiMacdStrategy', () => {
  const strategy = new EmaRsiMacdStrategy();

  it('returns BUY when EMA, RSI, and MACD conditions are bullish', () => {
    const signal = strategy.evaluate(
      candlesFromCloses(Array.from({ length: 60 }, (_, index) => 100 + index)),
    );

    expect(signal.action).toBe('BUY');
    expect(signal.symbol).toBe('BTCUSDT');
  });

  it('returns SELL when EMA20 falls below EMA50', () => {
    const signal = strategy.evaluate(
      candlesFromCloses(Array.from({ length: 60 }, (_, index) => 200 - index)),
    );

    expect(signal.action).toBe('SELL');
  });

  it('returns HOLD for a neutral market', () => {
    const signal = strategy.evaluate(candlesFromCloses(Array.from({ length: 60 }, () => 100)));

    expect(signal.action).toBe('HOLD');
  });

  it('returns HOLD with a reason when indicator history is insufficient', () => {
    const signal = strategy.evaluate(candlesFromCloses([100, 101, 102]));

    expect(signal).toMatchObject({
      action: 'HOLD',
      metadata: { reason: 'INSUFFICIENT_DATA' },
    });
  });

  it('rejects candles from multiple markets', () => {
    expect(() =>
      strategy.evaluate([...candlesFromCloses([100]), ...candlesFromCloses([101], 'ETHUSDT')]),
    ).toThrow(StrategyInputError);
  });
});
