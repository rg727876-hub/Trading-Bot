# Strategy V1

`EmaRsiMacdStrategy` implements the initial signal-only strategy. It never sizes, approves, or
executes an order.

- **BUY**: EMA 20 is above EMA 50, RSI 14 is above 50, and MACD is above its signal line.
- **SELL**: EMA 20 is below EMA 50.
- **HOLD**: every other situation, including less than 50 candles of history.

Signals include the action, symbol, timestamp, and the calculated indicator values as metadata.
They intentionally do not include a confidence score because this strategy does not calculate one.

The strategy accepts one symbol and timeframe per evaluation. Risk management and paper execution
will consume its signals in later phases.
