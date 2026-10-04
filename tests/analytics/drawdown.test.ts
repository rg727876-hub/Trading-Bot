import { describe, expect, it } from 'vitest';

import { calculateMaximumDrawdown } from '../../src/analytics/drawdown.js';

describe('calculateMaximumDrawdown', () => {
  it('calculates the largest absolute decline from a previous equity peak', () => {
    expect(calculateMaximumDrawdown(['100', '110', '90', '120']).toString()).toBe('20');
  });

  it('returns zero for an empty or increasing equity curve', () => {
    expect(calculateMaximumDrawdown([]).toString()).toBe('0');
    expect(calculateMaximumDrawdown(['100', '101']).toString()).toBe('0');
  });
});
