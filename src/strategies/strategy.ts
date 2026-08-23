import type { Candle } from '../market/candle.js';

export type SignalAction = 'BUY' | 'SELL' | 'HOLD';

export interface Signal {
  action: SignalAction;
  metadata: Record<string, string>;
  symbol: string;
  timestamp: Date;
}

export interface Strategy {
  evaluate(candles: readonly Candle[]): Signal;
}
