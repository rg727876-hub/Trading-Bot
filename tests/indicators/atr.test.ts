import { describe, expect, it } from 'vitest';

import { calculateAtr, IndicatorInputError } from '../../src/indicators/atr.js';
import { createCandle } from '../../src/market/candle.js';

const candle = (high: string, low: string, close: string) =>
  createCandle({
    close,
    high,
    low,
    open: close,
    symbol: 'BTCUSDT',
    timeframe: '1h',
    timestamp: new Date('2026-01-01T00:00:00.000Z'),
    volume: '1',
  });

describe('calculateAtr', () => {
  it('calculates Wilder ATR after enough true ranges are available', () => {
    const values = calculateAtr(
      [candle('12', '10', '11'), candle('15', '11', '14'), candle('16', '13', '15')],
      2,
    );

    expect(values.map((value) => value?.toString())).toEqual([undefined, '3', '3']);
  });

  it('returns undefined for insufficient candles', () => {
    expect(calculateAtr([candle('12', '10', '11')], 2)).toEqual([undefined]);
  });

  it('rejects an invalid period', () => {
    expect(() => calculateAtr([], 0)).toThrow(IndicatorInputError);
  });
});
