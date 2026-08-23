import { describe, expect, it } from 'vitest';

import { IndicatorService } from '../../src/indicators/indicator-service.js';
import { createCandle } from '../../src/market/candle.js';

const candles = Array.from({ length: 50 }, (_, index) => {
  const price = (100 + index).toString();
  return createCandle({
    close: price,
    high: (101 + index).toString(),
    low: (99 + index).toString(),
    open: price,
    symbol: 'BTCUSDT',
    timeframe: '1h',
    timestamp: new Date(Date.UTC(2026, 0, 1, index)),
    volume: '10',
  });
});

describe('IndicatorService', () => {
  it('calculates the V1 indicator set while preserving candle alignment', () => {
    const indicators = new IndicatorService().calculate(candles);

    expect(indicators.ema20).toHaveLength(50);
    expect(indicators.ema50).toHaveLength(50);
    expect(indicators.rsi14).toHaveLength(50);
    expect(indicators.macd).toHaveLength(50);
    expect(indicators.atr14).toHaveLength(50);
    expect(indicators.rsi14[49]?.toString()).toBe('100');
    expect(indicators.atr14[49]?.toString()).toBe('2');
  });
});
