# Paper trading

`PaperTradingEngine` is a local, deterministic cash ledger. It has no network calls, exchange
credentials, or capability to submit real orders.

V1 supports one long spot-style position. Opening reserves entry notional plus its fee; closing
credits exit notional minus its fee. P&L includes both entry and exit fees and all monetary values
use `decimal.js`.

The lifecycle is explicit:

```text
NO_POSITION → SIGNAL_DETECTED → RISK_VALIDATION → OPENING → OPEN → CLOSING → CLOSED → NO_POSITION
```

`processCandle` closes an open position at stop loss or take profit. OHLC data cannot reveal which
threshold occurred first inside a candle; if both are touched, the engine selects stop loss first
as the conservative simulation assumption.
