# Market data

The initial market-data source is an in-memory `HistoricalDataProvider`. It is intended for
deterministic local datasets, unit tests, and the forthcoming backtest engine; it makes no
exchange or network calls.

Each OHLCV candle is immutable and uses `decimal.js` for price and volume values. Construction
rejects non-positive prices, negative volume, invalid timestamps, and inconsistent OHLC ranges.

For each symbol and timeframe, historical candles must be supplied in strictly increasing
timestamp order. Duplicate or unordered timestamps are rejected before a backtest can consume
them, reducing the risk of invalid simulations or look-ahead errors.
