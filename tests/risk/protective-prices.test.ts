import { describe, expect, it } from 'vitest';

import {
  ProtectivePriceInputError,
  calculateFixedPercentageStopLoss,
  calculateRiskRewardTakeProfit,
} from '../../src/risk/protective-prices.js';

describe('protective prices', () => {
  it('calculates a fixed percentage stop loss for a BUY', () => {
    expect(
      calculateFixedPercentageStopLoss({
        entryPrice: '100',
        percentage: '0.02',
        side: 'BUY',
      }).toString(),
    ).toBe('98');
  });

  it('calculates a risk/reward take profit for a BUY', () => {
    expect(
      calculateRiskRewardTakeProfit({
        entryPrice: '100',
        riskReward: '2',
        side: 'BUY',
        stopLoss: '95',
      }).toString(),
    ).toBe('110');
  });

  it('rejects a stop on the wrong side of the entry', () => {
    expect(() =>
      calculateRiskRewardTakeProfit({
        entryPrice: '100',
        riskReward: '2',
        side: 'BUY',
        stopLoss: '101',
      }),
    ).toThrow(ProtectivePriceInputError);
  });
});
