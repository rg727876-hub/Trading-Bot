import type { Candle } from './candle.js';
import type { MarketDataProvider, MarketDataQuery } from './market-data.js';

export class HistoricalDataOrderError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'HistoricalDataOrderError';
  }
}

/** In-memory historical source for deterministic local backtests and tests. */
export class HistoricalDataProvider implements MarketDataProvider {
  private readonly candles: readonly Candle[];

  public constructor(candles: readonly Candle[]) {
    assertChronologicalOrder(candles);
    this.candles = Object.freeze([...candles]);
  }

  public async getCandles(query: MarketDataQuery): Promise<readonly Candle[]> {
    return this.candles.filter((candle) => {
      if (candle.symbol !== query.symbol || candle.timeframe !== query.timeframe) {
        return false;
      }

      const timestamp = candle.timestamp.getTime();
      return (
        (query.start === undefined || timestamp >= query.start.getTime()) &&
        (query.end === undefined || timestamp <= query.end.getTime())
      );
    });
  }
}

function assertChronologicalOrder(candles: readonly Candle[]): void {
  const latestTimestampByMarket = new Map<string, number>();

  for (const candle of candles) {
    const market = `${candle.symbol}:${candle.timeframe}`;
    const timestamp = candle.timestamp.getTime();
    const latestTimestamp = latestTimestampByMarket.get(market);

    if (latestTimestamp !== undefined && timestamp <= latestTimestamp) {
      throw new HistoricalDataOrderError(
        `Historical candles for ${market} must be strictly chronological without duplicates.`,
      );
    }

    latestTimestampByMarket.set(market, timestamp);
  }
}
