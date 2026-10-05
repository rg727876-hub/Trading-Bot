import Fastify, { type FastifyInstance, type FastifyReply } from 'fastify';
import { z } from 'zod';

import { calculatePerformanceMetrics } from '../analytics/metrics.js';
import { BacktestEngine } from '../backtesting/backtest-engine.js';
import { PaperTradingEngine } from '../execution/paper-trading.js';
import { HistoricalDataProvider } from '../market/historical-data-provider.js';
import type { MarketDataProvider } from '../market/market-data.js';
import { createCandle } from '../market/candle.js';
import { EmaRsiMacdStrategy } from '../strategies/ema-rsi-macd.strategy.js';

type BotStatus = 'RUNNING' | 'PAUSED' | 'STOPPED';

export interface ApiServerDependencies {
  marketDataProvider?: MarketDataProvider;
  paperTradingEngine?: PaperTradingEngine;
}

const candleSchema = z
  .object({
    close: z.string().min(1),
    high: z.string().min(1),
    low: z.string().min(1),
    open: z.string().min(1),
    timestamp: z.string().datetime({ offset: true }),
    volume: z.string().min(1),
  })
  .strict();

const backtestSchema = z
  .object({
    candles: z.array(candleSchema),
    symbol: z.string().trim().min(1),
    timeframe: z.string().trim().min(1),
  })
  .strict();

const marketParamsSchema = z.object({ symbol: z.string().trim().min(1) });
const marketQuerySchema = z.object({ timeframe: z.string().trim().min(1).default('1h') });

export function createApiServer(dependencies: ApiServerDependencies = {}): FastifyInstance {
  const app = Fastify({ logger: { level: 'silent' } });
  const marketDataProvider = dependencies.marketDataProvider ?? new HistoricalDataProvider([]);
  const paper =
    dependencies.paperTradingEngine ??
    new PaperTradingEngine({ feeRate: '0.001', initialBalance: '1000' });
  let botStatus: BotStatus = 'STOPPED';

  app.get('/api/status', () => ({ mode: 'paper', status: botStatus }));
  app.get('/api/balance', () => ({ balance: paper.balance.toString() }));
  app.get('/api/positions', () =>
    paper.position === undefined ? [] : [serializePosition(paper.position)],
  );
  app.get('/api/trades', () => paper.trades.map(serializeTrade));
  app.get('/api/performance', () => serializeMetrics(calculatePerformanceMetrics(paper.trades)));

  app.get('/api/market/:symbol', async (request, reply) => {
    const params = marketParamsSchema.safeParse(request.params);
    const query = marketQuerySchema.safeParse(request.query);
    if (!params.success || !query.success) return validationError(reply);

    const candles = await marketDataProvider.getCandles({
      symbol: params.data.symbol,
      timeframe: query.data.timeframe,
    });
    return candles.map((candle) => ({
      close: candle.close.toString(),
      high: candle.high.toString(),
      low: candle.low.toString(),
      open: candle.open.toString(),
      symbol: candle.symbol,
      timeframe: candle.timeframe,
      timestamp: candle.timestamp.toISOString(),
      volume: candle.volume.toString(),
    }));
  });

  app.post('/api/bot/start', () => {
    botStatus = 'RUNNING';
    return { mode: 'paper', status: botStatus };
  });
  app.post('/api/bot/pause', () => {
    botStatus = 'PAUSED';
    return { mode: 'paper', status: botStatus };
  });
  app.post('/api/bot/stop', () => {
    botStatus = 'STOPPED';
    return { mode: 'paper', status: botStatus };
  });

  app.post('/api/backtest', async (request, reply) => {
    const body = backtestSchema.safeParse(request.body);
    if (!body.success) return validationError(reply);

    try {
      const candles = body.data.candles.map((candle) =>
        createCandle({
          ...candle,
          symbol: body.data.symbol,
          timeframe: body.data.timeframe,
          timestamp: new Date(candle.timestamp),
        }),
      );
      const result = new BacktestEngine(new EmaRsiMacdStrategy(), {
        feeRate: '0.001',
        initialBalance: '1000',
        maxOpenPositions: 1,
        riskPerTrade: '0.01',
        riskReward: '2',
        stopLossPercentage: '0.02',
      }).run(candles);

      return {
        finalBalance: result.finalBalance.toString(),
        initialBalance: result.initialBalance.toString(),
        maxDrawdown: result.maxDrawdown.toString(),
        metrics: serializeMetrics(result.metrics),
        trades: result.trades.map(serializeTrade),
      };
    } catch {
      return validationError(reply);
    }
  });

  return app;
}

function validationError(reply: FastifyReply) {
  return reply.status(400).send({ error: 'VALIDATION_ERROR' });
}

function serializePosition(position: NonNullable<PaperTradingEngine['position']>) {
  return {
    entryPrice: position.entryPrice.toString(),
    id: position.id,
    quantity: position.quantity.toString(),
    status: position.status,
    stopLoss: position.stopLoss.toString(),
    symbol: position.symbol,
    takeProfit: position.takeProfit.toString(),
  };
}

function serializeTrade(trade: PaperTradingEngine['trades'][number]) {
  return {
    entryPrice: trade.entryPrice.toString(),
    entryTime: trade.entryTime.toISOString(),
    exitPrice: trade.exitPrice.toString(),
    exitReason: trade.exitReason,
    exitTime: trade.exitTime.toISOString(),
    fees: trade.fees.toString(),
    id: trade.id,
    profitLoss: trade.profitLoss.toString(),
    quantity: trade.quantity.toString(),
    status: trade.status,
    symbol: trade.symbol,
  };
}

function serializeMetrics(metrics: ReturnType<typeof calculatePerformanceMetrics>) {
  return {
    averageLoss: metrics.averageLoss.toString(),
    averageWin: metrics.averageWin.toString(),
    expectancy: metrics.expectancy.toString(),
    grossLoss: metrics.grossLoss.toString(),
    grossProfit: metrics.grossProfit.toString(),
    losingTrades: metrics.losingTrades,
    netPnl: metrics.netPnl.toString(),
    profitFactor: metrics.profitFactor?.toString(),
    totalTrades: metrics.totalTrades,
    winRate: metrics.winRate.toString(),
    winningTrades: metrics.winningTrades,
  };
}
