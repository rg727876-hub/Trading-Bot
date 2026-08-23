import { Decimal } from 'decimal.js';

export interface CandleInput {
  close: Decimal.Value;
  high: Decimal.Value;
  low: Decimal.Value;
  open: Decimal.Value;
  symbol: string;
  timeframe: string;
  timestamp: Date;
  volume: Decimal.Value;
}

export interface Candle {
  readonly close: Decimal;
  readonly high: Decimal;
  readonly low: Decimal;
  readonly open: Decimal;
  readonly symbol: string;
  readonly timeframe: string;
  readonly timestamp: Date;
  readonly volume: Decimal;
}

export class CandleValidationError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'CandleValidationError';
  }
}

export function createCandle(input: CandleInput): Candle {
  if (!input.symbol.trim() || !input.timeframe.trim()) {
    throw new CandleValidationError('Candle symbol and timeframe are required.');
  }

  if (Number.isNaN(input.timestamp.getTime())) {
    throw new CandleValidationError('Candle timestamp must be a valid date.');
  }

  let open: Decimal;
  let high: Decimal;
  let low: Decimal;
  let close: Decimal;
  let volume: Decimal;

  try {
    open = new Decimal(input.open);
    high = new Decimal(input.high);
    low = new Decimal(input.low);
    close = new Decimal(input.close);
    volume = new Decimal(input.volume);
  } catch {
    throw new CandleValidationError('Candle numeric values must be valid decimals.');
  }

  if (open.lte(0) || high.lte(0) || low.lte(0) || close.lte(0)) {
    throw new CandleValidationError('Candle prices must be greater than zero.');
  }

  if (volume.lt(0)) {
    throw new CandleValidationError('Candle volume cannot be negative.');
  }

  if (high.lt(Decimal.max(open, close)) || low.gt(Decimal.min(open, close)) || high.lt(low)) {
    throw new CandleValidationError('Candle OHLC values are inconsistent.');
  }

  return Object.freeze({
    close,
    high,
    low,
    open,
    symbol: input.symbol.trim(),
    timeframe: input.timeframe.trim(),
    timestamp: new Date(input.timestamp),
    volume,
  });
}
