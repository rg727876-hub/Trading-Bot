import { Decimal } from 'decimal.js';

export interface PositionSizingInput {
  capital: Decimal.Value;
  entryPrice: Decimal.Value;
  riskPerTrade: Decimal.Value;
  stopLoss: Decimal.Value;
}

export class PositionSizingInputError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'PositionSizingInputError';
  }
}

/** Sizes a position from the maximum monetary loss between entry and stop. */
export function calculatePositionSize(input: PositionSizingInput): Decimal {
  const { capital, entryPrice, riskPerTrade, stopLoss } = parseInput(input);
  const riskPerUnit = entryPrice.minus(stopLoss).abs();

  if (riskPerUnit.isZero()) {
    throw new PositionSizingInputError('Stop loss must differ from entry price.');
  }

  return capital.mul(riskPerTrade).div(riskPerUnit);
}

function parseInput(input: PositionSizingInput) {
  try {
    const capital = new Decimal(input.capital);
    const entryPrice = new Decimal(input.entryPrice);
    const riskPerTrade = new Decimal(input.riskPerTrade);
    const stopLoss = new Decimal(input.stopLoss);

    if (capital.lte(0) || entryPrice.lte(0) || stopLoss.lte(0)) {
      throw new PositionSizingInputError('Capital and prices must be greater than zero.');
    }
    if (riskPerTrade.lt(0) || riskPerTrade.gt(1)) {
      throw new PositionSizingInputError('Risk per trade must be between zero and one.');
    }

    return { capital, entryPrice, riskPerTrade, stopLoss };
  } catch (error) {
    if (error instanceof PositionSizingInputError) throw error;
    throw new PositionSizingInputError('Position sizing values must be valid decimals.');
  }
}
