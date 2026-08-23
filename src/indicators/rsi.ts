import { Decimal } from 'decimal.js';

import { assertValidPeriod, parsePrices } from './indicator-input.js';

export { IndicatorInputError } from './indicator-input.js';

/** Wilder RSI, aligned to the input series with undefined warm-up entries. */
export function calculateRsi(
  prices: readonly Decimal.Value[],
  period: number,
): Array<Decimal | undefined> {
  assertValidPeriod(period);
  const values = parsePrices(prices);
  const rsi: Array<Decimal | undefined> = Array.from({ length: values.length }, () => undefined);

  if (values.length <= period) {
    return rsi;
  }

  let gains = new Decimal(0);
  let losses = new Decimal(0);
  for (let index = 1; index <= period; index += 1) {
    const change = (values[index] as Decimal).minus(values[index - 1] as Decimal);
    if (change.gt(0)) gains = gains.plus(change);
    if (change.lt(0)) losses = losses.plus(change.abs());
  }

  let averageGain = gains.div(period);
  let averageLoss = losses.div(period);
  rsi[period] = calculateRsiValue(averageGain, averageLoss);

  for (let index = period + 1; index < values.length; index += 1) {
    const change = (values[index] as Decimal).minus(values[index - 1] as Decimal);
    const gain = Decimal.max(change, 0);
    const loss = Decimal.max(change.negated(), 0);
    averageGain = averageGain
      .mul(period - 1)
      .plus(gain)
      .div(period);
    averageLoss = averageLoss
      .mul(period - 1)
      .plus(loss)
      .div(period);
    rsi[index] = calculateRsiValue(averageGain, averageLoss);
  }

  return rsi;
}

function calculateRsiValue(averageGain: Decimal, averageLoss: Decimal): Decimal {
  if (averageGain.isZero() && averageLoss.isZero()) return new Decimal(50);
  if (averageLoss.isZero()) return new Decimal(100);
  return new Decimal(100).minus(new Decimal(100).div(averageGain.div(averageLoss).plus(1)));
}
