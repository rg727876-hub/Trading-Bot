import { Decimal } from 'decimal.js';

import { assertValidPeriod, parsePrices } from './indicator-input.js';

export { IndicatorInputError } from './indicator-input.js';

/** EMA seeded with the first available price, preserving series alignment. */
export function calculateEma(prices: readonly Decimal.Value[], period: number): Decimal[] {
  assertValidPeriod(period);
  const values = parsePrices(prices);
  if (values.length === 0) {
    return [];
  }

  const multiplier = new Decimal(2).div(period + 1);
  const ema = [values[0] as Decimal];

  for (let index = 1; index < values.length; index += 1) {
    const previous = ema[index - 1] as Decimal;
    const current = values[index] as Decimal;
    ema.push(current.minus(previous).mul(multiplier).plus(previous));
  }

  return ema;
}
