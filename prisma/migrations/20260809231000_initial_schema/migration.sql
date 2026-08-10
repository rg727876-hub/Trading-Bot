-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "TradeSide" AS ENUM ('BUY', 'SELL');

-- CreateEnum
CREATE TYPE "TradeStatus" AS ENUM ('OPEN', 'CLOSED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PositionStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "BotEventType" AS ENUM ('BOT_STARTED', 'BOT_STOPPED', 'BOT_PAUSED', 'MARKET_DATA_RECEIVED', 'SIGNAL_GENERATED', 'TRADE_OPENED', 'TRADE_CLOSED', 'STOP_LOSS_TRIGGERED', 'TAKE_PROFIT_TRIGGERED', 'BACKTEST_STARTED', 'BACKTEST_COMPLETED', 'ERROR');

-- CreateTable
CREATE TABLE "MarketData" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "timeframe" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "open" DECIMAL(30,10) NOT NULL,
    "high" DECIMAL(30,10) NOT NULL,
    "low" DECIMAL(30,10) NOT NULL,
    "close" DECIMAL(30,10) NOT NULL,
    "volume" DECIMAL(30,10) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MarketData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Strategy" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "version" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "configuration" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Strategy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trade" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "side" "TradeSide" NOT NULL,
    "quantity" DECIMAL(30,10) NOT NULL,
    "entryPrice" DECIMAL(30,10) NOT NULL,
    "exitPrice" DECIMAL(30,10),
    "stopLoss" DECIMAL(30,10),
    "takeProfit" DECIMAL(30,10),
    "fees" DECIMAL(30,10) NOT NULL DEFAULT 0,
    "profitLoss" DECIMAL(30,10),
    "entryTime" TIMESTAMP(3) NOT NULL,
    "exitTime" TIMESTAMP(3),
    "exitReason" TEXT,
    "strategyId" TEXT NOT NULL,
    "status" "TradeStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Trade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Position" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "side" "TradeSide" NOT NULL,
    "quantity" DECIMAL(30,10) NOT NULL,
    "entryPrice" DECIMAL(30,10) NOT NULL,
    "stopLoss" DECIMAL(30,10),
    "takeProfit" DECIMAL(30,10),
    "unrealizedPnl" DECIMAL(30,10) NOT NULL DEFAULT 0,
    "openedAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "PositionStatus" NOT NULL DEFAULT 'OPEN',
    CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BalanceHistory" (
    "id" TEXT NOT NULL,
    "balance" DECIMAL(30,10) NOT NULL,
    "equity" DECIMAL(30,10) NOT NULL,
    "realizedPnl" DECIMAL(30,10) NOT NULL DEFAULT 0,
    "unrealizedPnl" DECIMAL(30,10) NOT NULL DEFAULT 0,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BalanceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BacktestResult" (
    "id" TEXT NOT NULL,
    "strategyId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "timeframe" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "initialBalance" DECIMAL(30,10) NOT NULL,
    "finalBalance" DECIMAL(30,10) NOT NULL,
    "totalTrades" INTEGER NOT NULL,
    "winningTrades" INTEGER NOT NULL,
    "losingTrades" INTEGER NOT NULL,
    "winRate" DECIMAL(10,6) NOT NULL,
    "netPnl" DECIMAL(30,10) NOT NULL,
    "maxDrawdown" DECIMAL(30,10) NOT NULL,
    "profitFactor" DECIMAL(30,10) NOT NULL,
    "averageWin" DECIMAL(30,10) NOT NULL,
    "averageLoss" DECIMAL(30,10) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BacktestResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BotEvent" (
    "id" TEXT NOT NULL,
    "type" "BotEventType" NOT NULL,
    "message" TEXT NOT NULL,
    "symbol" TEXT,
    "tradeId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BotEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BotSettings" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "timeframe" TEXT NOT NULL,
    "riskPerTrade" DECIMAL(10,6) NOT NULL,
    "maxOpenPositions" INTEGER NOT NULL,
    "strategy" TEXT NOT NULL,
    "paperTradingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "notificationsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BotSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MarketData_symbol_timeframe_timestamp_idx" ON "MarketData"("symbol", "timeframe", "timestamp");
CREATE UNIQUE INDEX "MarketData_symbol_timeframe_timestamp_key" ON "MarketData"("symbol", "timeframe", "timestamp");
CREATE UNIQUE INDEX "Strategy_name_version_key" ON "Strategy"("name", "version");
CREATE INDEX "Trade_symbol_status_idx" ON "Trade"("symbol", "status");
CREATE INDEX "Trade_strategyId_entryTime_idx" ON "Trade"("strategyId", "entryTime");
CREATE INDEX "Position_symbol_status_idx" ON "Position"("symbol", "status");
CREATE INDEX "BalanceHistory_timestamp_idx" ON "BalanceHistory"("timestamp");
CREATE INDEX "BacktestResult_strategyId_createdAt_idx" ON "BacktestResult"("strategyId", "createdAt");
CREATE INDEX "BacktestResult_symbol_timeframe_startDate_endDate_idx" ON "BacktestResult"("symbol", "timeframe", "startDate", "endDate");
CREATE INDEX "BotEvent_type_createdAt_idx" ON "BotEvent"("type", "createdAt");
CREATE INDEX "BotEvent_symbol_createdAt_idx" ON "BotEvent"("symbol", "createdAt");

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_strategyId_fkey" FOREIGN KEY ("strategyId") REFERENCES "Strategy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BacktestResult" ADD CONSTRAINT "BacktestResult_strategyId_fkey" FOREIGN KEY ("strategyId") REFERENCES "Strategy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
