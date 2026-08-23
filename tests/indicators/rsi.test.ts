import { describe, expect, it } from 'vitest';

import { IndicatorInputError, calculateRsi } from '../../src/indicators/rsi.js';

describe('calculateRsi', () => {
  it('returns undefined until enough changes exist, then calculates Wilder RSI', () => {
    const values = calculateRsi(['1', '2', '3', '2', '4'], 2);

    expect(values.slice(0, 2)).toEqual([undefined, undefined]);
    expect(values[2]?.toFixed(2)).toBe('100.00');
    expect(values[3]?.toFixed(2)).toBe('50.00');
    expect(values[4]?.toFixed(2)).toBe('83.33');
  });

  it('returns 50 for a constant series once enough data is available', () => {
    expect(calculateRsi(['10', '10', '10'], 2).map((value) => value?.toString())).toEqual([
      undefined,
      undefined,
      '50',
    ]);
  });

  it('returns undefined for all entries when there is insufficient data', () => {
    expect(calculateRsi(['1', '2'], 2)).toEqual([undefined, undefined]);
  });

  it.each([0, -1, 1.5])('rejects an invalid period: %s', (period) => {
    expect(() => calculateRsi(['1', '2'], period)).toThrow(IndicatorInputError);
  });
});
