import { Decimal } from 'decimal.js';

export class IndicatorInputError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'IndicatorInputError';
  }
}

export function assertValidPeriod(period: number): void {
  if (!Number.isInteger(period) || period <= 0) {
    throw new IndicatorInputError('Indicator period must be a positive integer.');
  }
}

export function parsePrices(prices: readonly Decimal.Value[]): Decimal[] {
  try {
    const parsed = prices.map((price) => new Decimal(price));
    if (parsed.some((price) => !price.isFinite() || price.lte(0))) {
      throw new IndicatorInputError('Prices must be finite values greater than zero.');
    }
    return parsed;
  } catch (error) {
    if (error instanceof IndicatorInputError) {
      throw error;
    }
    throw new IndicatorInputError('Prices must be valid decimal values.');
  }
}
