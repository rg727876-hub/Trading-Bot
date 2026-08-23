import { describe, expect, it } from 'vitest';

import { IndicatorInputError, calculateEma } from '../../src/indicators/ema.js';

describe('calculateEma', () => {
  it('calculates an EMA seeded with the first price', () => {
    expect(calculateEma(['10', '11', '12'], 3).map(String)).toEqual(['10', '10.5', '11.25']);
  });

  it('returns an empty result for an empty price series', () => {
    expect(calculateEma([], 3)).toEqual([]);
  });

  it('preserves constant prices', () => {
    expect(calculateEma(['100', '100', '100'], 2).map(String)).toEqual(['100', '100', '100']);
  });

  it.each([0, -1, 1.5])('rejects an invalid period: %s', (period) => {
    expect(() => calculateEma(['100'], period)).toThrow(IndicatorInputError);
  });

  it('rejects invalid prices', () => {
    expect(() => calculateEma(['100', 'not-a-number'], 2)).toThrow(IndicatorInputError);
  });
});
