import { Decimal } from 'decimal.js';

export type BotStatus = 'RUNNING' | 'PAUSED' | 'STOPPED';
export type RiskRejectionReason =
  | 'INVALID_SIGNAL'
  | 'BOT_PAUSED'
  | 'MAX_POSITIONS_REACHED'
  | 'INSUFFICIENT_BALANCE'
  | 'INVALID_PRICE'
  | 'INVALID_QUANTITY'
  | 'RISK_LIMIT_EXCEEDED';

export interface RiskManagerConfig {
  maxOpenPositions: number;
  riskPerTrade: Decimal.Value;
}

export interface RiskValidationRequest {
  availableBalance: Decimal.Value;
  botStatus: BotStatus;
  entryPrice: Decimal.Value;
  openPositions: number;
  quantity: Decimal.Value;
  signal: { action: 'BUY' | 'SELL' | 'HOLD'; symbol: string; timestamp: Date };
  stopLoss: Decimal.Value;
}

export type RiskValidationResult =
  { approved: true } | { approved: false; reason: RiskRejectionReason };

/** Validates a proposed paper-trading entry before any execution is attempted. */
export class RiskManager {
  private readonly maxOpenPositions: number;
  private readonly riskPerTrade: Decimal;

  public constructor(config: RiskManagerConfig) {
    if (!Number.isInteger(config.maxOpenPositions) || config.maxOpenPositions < 1) {
      throw new Error('maxOpenPositions must be a positive integer.');
    }

    try {
      this.riskPerTrade = new Decimal(config.riskPerTrade);
    } catch {
      throw new Error('riskPerTrade must be a valid decimal.');
    }
    if (this.riskPerTrade.lt(0) || this.riskPerTrade.gt(1)) {
      throw new Error('riskPerTrade must be between zero and one.');
    }
    this.maxOpenPositions = config.maxOpenPositions;
  }

  public validate(request: RiskValidationRequest): RiskValidationResult {
    if (request.signal.action !== 'BUY' || !request.signal.symbol.trim()) {
      return { approved: false, reason: 'INVALID_SIGNAL' };
    }
    if (request.botStatus !== 'RUNNING') return { approved: false, reason: 'BOT_PAUSED' };
    if (
      !Number.isInteger(request.openPositions) ||
      request.openPositions < 0 ||
      request.openPositions >= this.maxOpenPositions
    ) {
      return { approved: false, reason: 'MAX_POSITIONS_REACHED' };
    }

    const values = parseOrderValues(request);
    if (values === undefined) return { approved: false, reason: 'INVALID_PRICE' };
    const { availableBalance, entryPrice, quantity, stopLoss } = values;
    if (quantity.lte(0)) return { approved: false, reason: 'INVALID_QUANTITY' };
    if (stopLoss.gte(entryPrice)) return { approved: false, reason: 'INVALID_PRICE' };
    if (quantity.mul(entryPrice).gt(availableBalance)) {
      return { approved: false, reason: 'INSUFFICIENT_BALANCE' };
    }

    const maximumLoss = availableBalance.mul(this.riskPerTrade);
    const proposedLoss = quantity.mul(entryPrice.minus(stopLoss));
    if (proposedLoss.gt(maximumLoss)) return { approved: false, reason: 'RISK_LIMIT_EXCEEDED' };

    return { approved: true };
  }
}

function parseOrderValues(request: RiskValidationRequest) {
  try {
    const availableBalance = new Decimal(request.availableBalance);
    const entryPrice = new Decimal(request.entryPrice);
    const quantity = new Decimal(request.quantity);
    const stopLoss = new Decimal(request.stopLoss);
    if (availableBalance.lte(0) || entryPrice.lte(0) || stopLoss.lte(0)) return undefined;
    return { availableBalance, entryPrice, quantity, stopLoss };
  } catch {
    return undefined;
  }
}
