import { describe, expect, it } from 'vitest';

import { PositionSizingInputError, calculatePositionSize } from '../../src/risk/position-sizing.js';

describe('calculatePositionSize', () => {
  it('calculates size for 1% risk', () => {
    expect(
      calculatePositionSize({
        capital: '1000',
        entryPrice: '100',
        riskPerTrade: '0.01',
        stopLoss: '95',
      }).toString(),
    ).toBe('2');
  });

  it('calculates size for 2% risk', () => {
    expect(
      calculatePositionSize({
        capital: '1000',
        entryPrice: '100',
        riskPerTrade: '0.02',
        stopLoss: '95',
      }).toString(),
    ).toBe('4');
  });

  it('returns zero for 0% risk', () => {
    expect(
      calculatePositionSize({
        capital: '1000',
        entryPrice: '100',
        riskPerTrade: '0',
        stopLoss: '95',
      }).toString(),
    ).toBe('0');
  });

  it.each([
    ['negative risk', { riskPerTrade: '-0.01' }],
    ['risk greater than 100%', { riskPerTrade: '1.01' }],
    ['stop equal to entry', { stopLoss: '100' }],
    ['negative capital', { capital: '-1' }],
  ])('rejects %s', (_reason, changes) => {
    expect(() =>
      calculatePositionSize({
        capital: '1000',
        entryPrice: '100',
        riskPerTrade: '0.01',
        stopLoss: '95',
        ...changes,
      }),
    ).toThrow(PositionSizingInputError);
  });
});
