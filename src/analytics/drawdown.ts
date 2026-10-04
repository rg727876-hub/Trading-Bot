import { Decimal } from 'decimal.js';

/** Returns the largest absolute equity decline from any prior peak. */
export function calculateMaximumDrawdown(equity: readonly Decimal.Value[]): Decimal {
  let peak: Decimal | undefined;
  let maximumDrawdown = new Decimal(0);

  for (const value of equity) {
    const current = new Decimal(value);
    if (peak === undefined || current.gt(peak)) {
      peak = current;
      continue;
    }
    maximumDrawdown = Decimal.max(maximumDrawdown, peak.minus(current));
  }

  return maximumDrawdown;
}
