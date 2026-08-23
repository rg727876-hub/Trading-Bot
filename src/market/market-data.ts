import type { Candle } from './candle.js';

export interface MarketDataQuery {
  end?: Date;
  start?: Date;
  symbol: string;
  timeframe: string;
}

export interface MarketDataProvider {
  getCandles(query: MarketDataQuery): Promise<readonly Candle[]>;
}
