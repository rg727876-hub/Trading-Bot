import { Decimal } from 'decimal.js';

export interface BacktestPersistenceMetrics {
  averageLoss: Decimal;
  averageWin: Decimal;
  losingTrades: number;
  netPnl: Decimal;
  profitFactor: Decimal | undefined;
  totalTrades: number;
  winRate: Decimal;
  winningTrades: number;
}

export interface BacktestResultPersistenceInput {
  averageLoss: string;
  averageWin: string;
  endDate: Date;
  finalBalance: string;
  initialBalance: string;
  losingTrades: number;
  maxDrawdown: string;
  netPnl: string;
  profitFactor: string;
  startDate: Date;
  strategyId: string;
  symbol: string;
  timeframe: string;
  totalTrades: number;
  winRate: string;
  winningTrades: number;
}

export interface BacktestResultRepository {
  create(data: BacktestResultPersistenceInput): Promise<unknown>;
}

export interface PersistableBacktestResult {
  finalBalance: Decimal;
  initialBalance: Decimal;
  maxDrawdown: Decimal;
  metrics: BacktestPersistenceMetrics;
}

export async function persistBacktestResult(
  repository: BacktestResultRepository,
  input: {
    endDate: Date;
    result: PersistableBacktestResult;
    startDate: Date;
    strategyId: string;
    symbol: string;
    timeframe: string;
  },
): Promise<unknown> {
  const { metrics } = input.result;
  return repository.create({
    averageLoss: metrics.averageLoss.toString(),
    averageWin: metrics.averageWin.toString(),
    endDate: input.endDate,
    finalBalance: input.result.finalBalance.toString(),
    initialBalance: input.result.initialBalance.toString(),
    losingTrades: metrics.losingTrades,
    maxDrawdown: input.result.maxDrawdown.toString(),
    netPnl: metrics.netPnl.toString(),
    // Prisma stores a required decimal; zero makes no-loss backtests explicit.
    profitFactor: (metrics.profitFactor ?? new Decimal(0)).toString(),
    startDate: input.startDate,
    strategyId: input.strategyId,
    symbol: input.symbol,
    timeframe: input.timeframe,
    totalTrades: metrics.totalTrades,
    winRate: metrics.winRate.toString(),
    winningTrades: metrics.winningTrades,
  });
}
