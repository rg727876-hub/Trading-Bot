import { Decimal } from 'decimal.js';

import { assertValidPeriod, IndicatorInputError, parsePrices } from './indicator-input.js';

export { IndicatorInputError } from './indicator-input.js';

export interface MacdValue {
  histogram: Decimal;
  macd: Decimal;
  signal: Decimal;
}

export function calculateMacd(
  prices: readonly Decimal.Value[],
  fastPeriod: number,
  slowPeriod: number,
  signalPeriod: number,
): MacdValue[] {
  assertValidPeriod(fastPeriod);
  assertValidPeriod(slowPeriod);
  assertValidPeriod(signalPeriod);
  if (fastPeriod >= slowPeriod) {
    throw new IndicatorInputError('MACD fast period must be less than the slow period.');
  }

  const values = parsePrices(prices);
  const fast = calculateEmaValues(values, fastPeriod);
  const slow = calculateEmaValues(values, slowPeriod);
  const macd = values.map((_, index) => (fast[index] as Decimal).minus(slow[index] as Decimal));
  const signal = calculateEmaValues(macd, signalPeriod);

  return macd.map((value, index) => ({
    histogram: value.minus(signal[index] as Decimal),
    macd: value,
    signal: signal[index] as Decimal,
  }));
}

function calculateEmaValues(values: readonly Decimal[], period: number): Decimal[] {
  if (values.length === 0) return [];

  const multiplier = new Decimal(2).div(period + 1);
  const ema = [values[0] as Decimal];
  for (let index = 1; index < values.length; index += 1) {
    const previous = ema[index - 1] as Decimal;
    const current = values[index] as Decimal;
    ema.push(current.minus(previous).mul(multiplier).plus(previous));
  }
  return ema;
}
