import { describe, expect, it } from 'vitest';

import { calculateMacd, IndicatorInputError } from '../../src/indicators/macd.js';

describe('calculateMacd', () => {
  it('calculates MACD, signal and histogram without removing early entries', () => {
    const values = calculateMacd(['1', '2', '3', '4'], 2, 3, 2);

    expect(values).toHaveLength(4);
    expect(values[0]?.macd.toString()).toBe('0');
    expect(values[3]?.macd.toFixed(6)).toBe('0.393519');
    expect(values[3]?.signal.toFixed(6)).toBe('0.342593');
    expect(values[3]?.histogram.toFixed(6)).toBe('0.050926');
  });

  it('returns zero values for constant prices', () => {
    expect(
      calculateMacd(['10', '10', '10'], 2, 3, 2).map((value) => value.histogram.toString()),
    ).toEqual(['0', '0', '0']);
  });

  it('rejects periods where fast is not less than slow', () => {
    expect(() => calculateMacd(['1', '2'], 3, 3, 2)).toThrow(IndicatorInputError);
  });
});
