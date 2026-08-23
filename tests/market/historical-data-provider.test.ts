import { describe, expect, it } from 'vitest';

import { createCandle } from '../../src/market/candle.js';
import {
  HistoricalDataOrderError,
  HistoricalDataProvider,
} from '../../src/market/historical-data-provider.js';

const candle = (timestamp: string, close = '100') =>
  createCandle({
    close,
    high: '200',
    low: '99',
    open: '100',
    symbol: 'BTCUSDT',
    timeframe: '1h',
    timestamp: new Date(timestamp),
    volume: '10',
  });

describe('HistoricalDataProvider', () => {
  it('returns only the requested market and inclusive time range', async () => {
    const provider = new HistoricalDataProvider([
      candle('2026-01-01T00:00:00.000Z'),
      candle('2026-01-01T01:00:00.000Z', '101'),
      candle('2026-01-01T02:00:00.000Z', '102'),
    ]);

    const candles = await provider.getCandles({
      end: new Date('2026-01-01T01:00:00.000Z'),
      start: new Date('2026-01-01T01:00:00.000Z'),
      symbol: 'BTCUSDT',
      timeframe: '1h',
    });

    expect(candles).toHaveLength(1);
    expect(candles[0]?.close.toString()).toBe('101');
  });

  it('rejects unsorted or duplicate timestamps to prevent invalid backtests', () => {
    expect(
      () =>
        new HistoricalDataProvider([
          candle('2026-01-01T01:00:00.000Z'),
          candle('2026-01-01T00:00:00.000Z'),
        ]),
    ).toThrow(HistoricalDataOrderError);
    expect(
      () =>
        new HistoricalDataProvider([
          candle('2026-01-01T00:00:00.000Z'),
          candle('2026-01-01T00:00:00.000Z'),
        ]),
    ).toThrow(HistoricalDataOrderError);
  });

  it('returns an empty collection for an unavailable market', async () => {
    const provider = new HistoricalDataProvider([candle('2026-01-01T00:00:00.000Z')]);

    await expect(provider.getCandles({ symbol: 'ETHUSDT', timeframe: '1h' })).resolves.toEqual([]);
  });
});
