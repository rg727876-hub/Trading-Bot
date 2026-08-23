import { Decimal } from 'decimal.js';

import { type Candle } from '../market/candle.js';
import { assertValidPeriod } from './indicator-input.js';

export { IndicatorInputError } from './indicator-input.js';

/** Wilder ATR, aligned to candles with undefined warm-up entries. */
export function calculateAtr(
  candles: readonly Candle[],
  period: number,
): Array<Decimal | undefined> {
  assertValidPeriod(period);
  const atr: Array<Decimal | undefined> = Array.from({ length: candles.length }, () => undefined);
  if (candles.length <= period) {
    return atr;
  }

  const trueRanges = candles.map((candle, index) => {
    if (index === 0) return candle.high.minus(candle.low);
    const previousClose = (candles[index - 1] as Candle).close;
    return Decimal.max(
      candle.high.minus(candle.low),
      candle.high.minus(previousClose).abs(),
      candle.low.minus(previousClose).abs(),
    );
  });

  let currentAtr = trueRanges
    .slice(0, period)
    .reduce((sum, range) => sum.plus(range), new Decimal(0))
    .div(period);
  atr[period - 1] = currentAtr;

  for (let index = period; index < trueRanges.length; index += 1) {
    currentAtr = currentAtr
      .mul(period - 1)
      .plus(trueRanges[index] as Decimal)
      .div(period);
    atr[index] = currentAtr;
  }

  return atr;
}
