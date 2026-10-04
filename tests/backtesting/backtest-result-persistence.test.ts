import { Decimal } from 'decimal.js';
import { describe, expect, it } from 'vitest';

import { persistBacktestResult } from '../../src/backtesting/backtest-result-persistence.js';

describe('persistBacktestResult', () => {
  it('maps calculated decimal metrics to a persistence record', async () => {
    let saved: Record<string, unknown> | undefined;
    await persistBacktestResult(
      {
        create: async (data) => {
          saved = data;
          return data;
        },
      },
      {
        endDate: new Date('2026-01-31T00:00:00.000Z'),
        result: {
          finalBalance: new Decimal('1100'),
          initialBalance: new Decimal('1000'),
          maxDrawdown: new Decimal('25'),
          metrics: {
            averageLoss: new Decimal('-5'),
            averageWin: new Decimal('10'),
            losingTrades: 2,
            netPnl: new Decimal('100'),
            profitFactor: new Decimal('2'),
            totalTrades: 5,
            winRate: new Decimal('0.6'),
            winningTrades: 3,
          },
        },
        startDate: new Date('2026-01-01T00:00:00.000Z'),
        strategyId: 'strategy-1',
        symbol: 'BTCUSDT',
        timeframe: '1h',
      },
    );

    expect(saved).toMatchObject({
      finalBalance: '1100',
      maxDrawdown: '25',
      netPnl: '100',
      strategyId: 'strategy-1',
      totalTrades: 5,
    });
  });
});
