import { describe, expect, it } from 'vitest';

import { calculatePerformanceMetrics } from '../../src/analytics/metrics.js';

describe('calculatePerformanceMetrics', () => {
  it('calculates trade performance metrics without floating-point arithmetic', () => {
    const metrics = calculatePerformanceMetrics([
      { profitLoss: '10' },
      { profitLoss: '-5' },
      { profitLoss: '0' },
    ]);

    expect(metrics.totalTrades).toBe(3);
    expect(metrics.winningTrades).toBe(1);
    expect(metrics.losingTrades).toBe(1);
    expect(metrics.winRate.toString()).toBe('0.33333333333333333333');
    expect(metrics.grossProfit.toString()).toBe('10');
    expect(metrics.grossLoss.toString()).toBe('5');
    expect(metrics.netPnl.toString()).toBe('5');
    expect(metrics.profitFactor.toString()).toBe('2');
    expect(metrics.averageWin.toString()).toBe('10');
    expect(metrics.averageLoss.toString()).toBe('-5');
  });

  it('returns zero-safe metrics when no trades are closed', () => {
    const metrics = calculatePerformanceMetrics([]);

    expect(metrics.totalTrades).toBe(0);
    expect(metrics.winRate.toString()).toBe('0');
    expect(metrics.profitFactor).toBeUndefined();
    expect(metrics.expectancy.toString()).toBe('0');
  });
});
