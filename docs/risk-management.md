# Risk management

Risk validation is a mandatory, pure step between a `BUY` signal and paper execution. It does not
place orders or mutate a portfolio.

The V1 `RiskManager` rejects a request with an explicit reason when the signal is invalid, the bot
is not running, the position limit has been reached, balance is insufficient, price/quantity is
invalid, or the potential loss at stop exceeds `riskPerTrade`.

`calculatePositionSize` uses:

```text
position size = capital × risk per trade / |entry price − stop loss|
```

All calculations use `decimal.js`. A zero risk configuration intentionally returns a zero size;
the Risk Manager then rejects any non-positive proposed quantity.

V1 provides a fixed-percentage stop loss and a risk/reward take profit. ATR-based protection is
deliberately deferred, keeping the two approaches separate.
