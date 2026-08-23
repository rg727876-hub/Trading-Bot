import { Decimal } from 'decimal.js';

export type ProtectiveSide = 'BUY' | 'SELL';

export class ProtectivePriceInputError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'ProtectivePriceInputError';
  }
}

export function calculateFixedPercentageStopLoss(input: {
  entryPrice: Decimal.Value;
  percentage: Decimal.Value;
  side: ProtectiveSide;
}): Decimal {
  const entryPrice = parsePositive(input.entryPrice, 'Entry price');
  const percentage = parsePositive(input.percentage, 'Stop percentage');
  if (percentage.gte(1)) {
    throw new ProtectivePriceInputError('Stop percentage must be less than one.');
  }

  return input.side === 'BUY'
    ? entryPrice.mul(new Decimal(1).minus(percentage))
    : entryPrice.mul(new Decimal(1).plus(percentage));
}

export function calculateRiskRewardTakeProfit(input: {
  entryPrice: Decimal.Value;
  riskReward: Decimal.Value;
  side: ProtectiveSide;
  stopLoss: Decimal.Value;
}): Decimal {
  const entryPrice = parsePositive(input.entryPrice, 'Entry price');
  const stopLoss = parsePositive(input.stopLoss, 'Stop loss');
  const riskReward = parsePositive(input.riskReward, 'Risk/reward ratio');
  const risk = entryPrice.minus(stopLoss).abs();

  if (
    risk.isZero() ||
    (input.side === 'BUY' && stopLoss.gte(entryPrice)) ||
    (input.side === 'SELL' && stopLoss.lte(entryPrice))
  ) {
    throw new ProtectivePriceInputError('Stop loss must be on the protective side of entry.');
  }

  return input.side === 'BUY'
    ? entryPrice.plus(risk.mul(riskReward))
    : entryPrice.minus(risk.mul(riskReward));
}

function parsePositive(value: Decimal.Value, label: string): Decimal {
  try {
    const decimal = new Decimal(value);
    if (decimal.lte(0)) throw new ProtectivePriceInputError(`${label} must be greater than zero.`);
    return decimal;
  } catch (error) {
    if (error instanceof ProtectivePriceInputError) throw error;
    throw new ProtectivePriceInputError(`${label} must be a valid decimal.`);
  }
}
