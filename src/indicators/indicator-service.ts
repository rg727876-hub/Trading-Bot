import { Decimal } from 'decimal.js';

import type { Candle } from '../market/candle.js';
import { calculateAtr } from './atr.js';
import { calculateEma } from './ema.js';
import { calculateMacd, type MacdValue } from './macd.js';
import { calculateRsi } from './rsi.js';

export interface IndicatorSnapshot {
  atr14: Array<Decimal | undefined>;
  ema20: Decimal[];
  ema50: Decimal[];
  macd: MacdValue[];
  rsi14: Array<Decimal | undefined>;
}

export class IndicatorService {
  public calculate(candles: readonly Candle[]): IndicatorSnapshot {
    const closes = candles.map((candle) => candle.close);

    return {
      atr14: calculateAtr(candles, 14),
      ema20: calculateEma(closes, 20),
      ema50: calculateEma(closes, 50),
      macd: calculateMacd(closes, 12, 26, 9),
      rsi14: calculateRsi(closes, 14),
    };
  }
}
