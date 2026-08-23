# Indicators

All indicator arithmetic uses `decimal.js`, avoiding JavaScript binary floating-point errors.

- **EMA** is seeded with the first price and therefore preserves input alignment from index zero.
- **RSI 14** applies Wilder smoothing. Entries before enough price changes are `undefined`; a flat
  market returns 50 once warmed up.
- **MACD 12/26/9** is calculated from aligned, first-price-seeded EMAs. It returns MACD, signal,
  and histogram at every input index.
- **ATR 14** applies Wilder smoothing to true ranges. Entries before the warm-up period are
  `undefined`.

`IndicatorService` provides the V1 parameter set but contains no signal or trading rules. Those
rules belong to strategies in the next phase.
