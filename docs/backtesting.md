# Backtesting

`BacktestEngine` processes historical candles strictly in timestamp order. For candle `n`, a
strategy receives only candles `0..n-1`; any resulting signal is executed at candle `n`'s opening
price. The current candle is therefore unavailable to signal generation, preventing look-ahead
bias.

The engine runs the paper-trading ledger, risk manager, fixed-percentage stop loss, and
risk/reward take profit. A position that remains open at the final candle is closed at that
candle's close with reason `BACKTEST_END`, making final balance and realized metrics explicit.

Metrics include totals, win rate, gross profit/loss, net P&L, average win/loss, profit factor, and
expectancy. Maximum drawdown is reported as an absolute currency decline from a previous equity
peak. All numeric values use `decimal.js`.

`persistBacktestResult` maps the calculation result to the database record through a narrow
repository interface. A no-loss backtest stores profit factor as zero because the current schema
requires that field to be numeric.
