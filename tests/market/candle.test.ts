import { Decimal } from 'decimal.js';
import { describe, expect, it } from 'vitest';

import { CandleValidationError, createCandle } from '../../src/market/candle.js';

const validCandle = {
  close: '101.25',
  high: '102.50',
  low: '99.50',
  open: '100.00',
  symbol: 'BTCUSDT',
  timeframe: '1h',
  timestamp: new Date('2026-01-01T00:00:00.000Z'),
  volume: '123.456',
};

describe('createCandle', () => {
  it('creates an immutable OHLCV candle using decimal values', () => {
    const candle = createCandle(validCandle);

    expect(candle.close).toEqual(new Decimal('101.25'));
    expect(candle.timestamp).toEqual(validCandle.timestamp);
    expect(Object.isFrozen(candle)).toBe(true);
  });

  it.each([
    ['high is below the open', { high: '99.99' }],
    ['low is above the close', { low: '101.26' }],
    ['negative volume', { volume: '-0.01' }],
    ['zero price', { open: '0' }],
    ['empty symbol', { symbol: '  ' }],
  ])('rejects invalid candle data when %s', (_reason, changes) => {
    expect(() => createCandle({ ...validCandle, ...changes })).toThrow(CandleValidationError);
  });
});
