import { PrismaClient, TradeSide } from '@prisma/client';
import { afterAll, afterEach, describe, expect, it } from 'vitest';

import { loadConfiguration } from '../../src/config/config.js';
import { assertSafeTestDatabaseConfiguration } from '../../src/database/test-database-guard.js';
import { createRepositories } from '../../src/database/repositories/index.js';

const configuration = loadConfiguration('test');
assertSafeTestDatabaseConfiguration(configuration);

const prisma = new PrismaClient({
  datasources: {
    db: { url: configuration.database.url },
  },
});
const repositories = createRepositories(prisma);
const testId = `integration-${Date.now()}`;
const balanceHistoryIds: string[] = [];

afterEach(async () => {
  await prisma.backtestResult.deleteMany({ where: { symbol: { startsWith: testId } } });
  await prisma.trade.deleteMany({ where: { symbol: { startsWith: testId } } });
  await prisma.position.deleteMany({ where: { symbol: { startsWith: testId } } });
  await prisma.marketData.deleteMany({ where: { symbol: { startsWith: testId } } });
  await prisma.balanceHistory.deleteMany({ where: { id: { in: balanceHistoryIds } } });
  balanceHistoryIds.length = 0;
  await prisma.botEvent.deleteMany({ where: { message: { startsWith: testId } } });
  await prisma.strategy.deleteMany({ where: { name: { startsWith: testId } } });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('database repositories', () => {
  it('stores MarketData and rejects a duplicate candle', async () => {
    const candle = {
      close: '101.25',
      high: '102.00',
      low: '99.50',
      open: '100.00',
      symbol: `${testId}-BTCUSDT`,
      timeframe: '1h',
      timestamp: new Date('2026-01-01T00:00:00.000Z'),
      volume: '15.75',
    };

    await expect(repositories.marketData.create(candle)).resolves.toMatchObject({
      symbol: candle.symbol,
    });
    await expect(repositories.marketData.create(candle)).rejects.toThrow();
  });

  it('creates, updates, and closes a trade', async () => {
    const strategy = await repositories.strategy.create({
      configuration: { fastEma: 20 },
      name: `${testId}-strategy`,
      version: '1.0.0',
    });
    const trade = await repositories.trade.create({
      entryPrice: '100',
      entryTime: new Date(),
      quantity: '2',
      side: TradeSide.BUY,
      strategyId: strategy.id,
      symbol: `${testId}-ETHUSDT`,
    });

    const updated = await repositories.trade.update(trade.id, { stopLoss: '95' });
    const closed = await repositories.trade.close(trade.id, {
      exitPrice: '110',
      exitReason: 'TAKE_PROFIT',
      exitTime: new Date(),
      profitLoss: '20',
    });

    expect(updated.stopLoss?.toString()).toBe('95');
    expect(closed.status).toBe('CLOSED');
    expect(closed.profitLoss?.toString()).toBe('20');
  });

  it('creates and closes a position', async () => {
    const position = await repositories.position.create({
      entryPrice: '100',
      openedAt: new Date(),
      quantity: '1',
      side: TradeSide.BUY,
      symbol: `${testId}-SOLUSDT`,
    });

    const closed = await repositories.position.close(position.id);

    expect(closed.status).toBe('CLOSED');
  });

  it('stores balance history, a backtest result, and a bot event', async () => {
    const strategy = await repositories.strategy.create({
      configuration: {},
      name: `${testId}-metrics-strategy`,
      version: '1.0.0',
    });
    const symbol = `${testId}-ADAUSDT`;

    const [balance, backtest, event] = await Promise.all([
      repositories.balanceHistory.create({
        balance: '1000',
        equity: '1005',
        timestamp: new Date(),
      }),
      repositories.backtestResult.create({
        averageLoss: '-5',
        averageWin: '10',
        endDate: new Date('2026-01-31T00:00:00.000Z'),
        finalBalance: '1100',
        initialBalance: '1000',
        losingTrades: 2,
        maxDrawdown: '25',
        netPnl: '100',
        profitFactor: '2',
        startDate: new Date('2026-01-01T00:00:00.000Z'),
        strategyId: strategy.id,
        symbol,
        timeframe: '1h',
        totalTrades: 5,
        winRate: '0.6',
        winningTrades: 3,
      }),
      repositories.botEvent.create({
        message: `${testId}-backtest completed`,
        type: 'BACKTEST_COMPLETED',
      }),
    ]);

    balanceHistoryIds.push(balance.id);

    expect(balance.equity.toString()).toBe('1005');
    expect(backtest.totalTrades).toBe(5);
    expect(event.type).toBe('BACKTEST_COMPLETED');
  });
});
