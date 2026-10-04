import { Decimal } from 'decimal.js';

export interface PerformanceTrade {
  profitLoss: Decimal.Value;
}

export interface PerformanceMetrics {
  averageLoss: Decimal;
  averageWin: Decimal;
  expectancy: Decimal;
  grossLoss: Decimal;
  grossProfit: Decimal;
  losingTrades: number;
  netPnl: Decimal;
  profitFactor: Decimal | undefined;
  totalTrades: number;
  winRate: Decimal;
  winningTrades: number;
}

export function calculatePerformanceMetrics(
  trades: readonly PerformanceTrade[],
): PerformanceMetrics {
  const profitLosses = trades.map((trade) => new Decimal(trade.profitLoss));
  const winners = profitLosses.filter((profitLoss) => profitLoss.gt(0));
  const losers = profitLosses.filter((profitLoss) => profitLoss.lt(0));
  const grossProfit = sum(winners);
  const grossLoss = sum(losers.map((profitLoss) => profitLoss.abs()));
  const totalTrades = trades.length;
  const netPnl = sum(profitLosses);

  return {
    averageLoss: losers.length === 0 ? new Decimal(0) : sum(losers).div(losers.length),
    averageWin: winners.length === 0 ? new Decimal(0) : grossProfit.div(winners.length),
    expectancy: totalTrades === 0 ? new Decimal(0) : netPnl.div(totalTrades),
    grossLoss,
    grossProfit,
    losingTrades: losers.length,
    netPnl,
    profitFactor: grossLoss.isZero() ? undefined : grossProfit.div(grossLoss),
    totalTrades,
    winRate: totalTrades === 0 ? new Decimal(0) : new Decimal(winners.length).div(totalTrades),
    winningTrades: winners.length,
  };
}

function sum(values: readonly Decimal[]): Decimal {
  return values.reduce((total, value) => total.plus(value), new Decimal(0));
}
