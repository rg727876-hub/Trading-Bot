import { type Prisma, PrismaClient, PositionStatus, TradeStatus } from '@prisma/client';

interface CloseTradeInput {
  exitPrice: string;
  exitReason: string;
  exitTime: Date;
  profitLoss: string;
}

/** Persistence boundary for the initial trading entities. */
export function createRepositories(prisma: PrismaClient) {
  return {
    backtestResult: {
      create: (data: Prisma.BacktestResultUncheckedCreateInput) =>
        prisma.backtestResult.create({ data }),
    },
    balanceHistory: {
      create: (data: Prisma.BalanceHistoryCreateInput) => prisma.balanceHistory.create({ data }),
    },
    botEvent: {
      create: (data: Prisma.BotEventCreateInput) => prisma.botEvent.create({ data }),
    },
    marketData: {
      create: (data: Prisma.MarketDataCreateInput) => prisma.marketData.create({ data }),
    },
    position: {
      close: (id: string) =>
        prisma.position.update({
          data: { status: PositionStatus.CLOSED },
          where: { id },
        }),
      create: (data: Prisma.PositionCreateInput) => prisma.position.create({ data }),
    },
    strategy: {
      create: (data: Prisma.StrategyCreateInput) => prisma.strategy.create({ data }),
    },
    trade: {
      close: (id: string, data: CloseTradeInput) =>
        prisma.trade.update({
          data: {
            ...data,
            status: TradeStatus.CLOSED,
          },
          where: { id },
        }),
      create: (data: Prisma.TradeUncheckedCreateInput) => prisma.trade.create({ data }),
      update: (id: string, data: Prisma.TradeUpdateInput) =>
        prisma.trade.update({ data, where: { id } }),
    },
  };
}
