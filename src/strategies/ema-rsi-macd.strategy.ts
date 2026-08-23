import { IndicatorService } from '../indicators/indicator-service.js';
import type { Candle } from '../market/candle.js';
import type { Signal, Strategy } from './strategy.js';

const MINIMUM_CANDLES = 50;

export class StrategyInputError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'StrategyInputError';
  }
}

/** V1 signal rules only; execution and risk controls remain outside this strategy. */
export class EmaRsiMacdStrategy implements Strategy {
  private readonly indicators: IndicatorService;

  public constructor(indicators = new IndicatorService()) {
    this.indicators = indicators;
  }

  public evaluate(candles: readonly Candle[]): Signal {
    if (candles.length === 0) {
      throw new StrategyInputError('A strategy requires at least one candle.');
    }

    const latestCandle = candles[candles.length - 1] as Candle;
    assertSingleMarket(candles, latestCandle);

    if (candles.length < MINIMUM_CANDLES) {
      return this.createSignal('HOLD', latestCandle, { reason: 'INSUFFICIENT_DATA' });
    }

    const values = this.indicators.calculate(candles);
    const index = candles.length - 1;
    const ema20 = values.ema20[index];
    const ema50 = values.ema50[index];
    const rsi = values.rsi14[index];
    const macd = values.macd[index];

    if (ema20 === undefined || ema50 === undefined || rsi === undefined || macd === undefined) {
      return this.createSignal('HOLD', latestCandle, { reason: 'INSUFFICIENT_DATA' });
    }

    const metadata = {
      ema20: ema20.toString(),
      ema50: ema50.toString(),
      macd: macd.macd.toString(),
      rsi: rsi.toString(),
      signal: macd.signal.toString(),
    };

    if (ema20.lt(ema50)) {
      return this.createSignal('SELL', latestCandle, metadata);
    }

    if (ema20.gt(ema50) && rsi.gt(50) && macd.macd.gt(macd.signal)) {
      return this.createSignal('BUY', latestCandle, metadata);
    }

    return this.createSignal('HOLD', latestCandle, metadata);
  }

  private createSignal(
    action: Signal['action'],
    candle: Candle,
    metadata: Record<string, string>,
  ): Signal {
    return {
      action,
      metadata,
      symbol: candle.symbol,
      timestamp: candle.timestamp,
    };
  }
}

function assertSingleMarket(candles: readonly Candle[], latestCandle: Candle): void {
  const hasDifferentMarket = candles.some(
    (candle) =>
      candle.symbol !== latestCandle.symbol || candle.timeframe !== latestCandle.timeframe,
  );

  if (hasDifferentMarket) {
    throw new StrategyInputError('Strategy candles must belong to one symbol and timeframe.');
  }
}
