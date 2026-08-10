# Database design

Prisma targets PostgreSQL/Supabase. Monetary and market numeric values use PostgreSQL
`DECIMAL`, mapped by Prisma to `Decimal`, rather than JavaScript floating-point numbers.

The `MarketData` unique key `(symbol, timeframe, timestamp)` prevents duplicate OHLCV candles.
Trade and backtest records retain their strategy relation, while events preserve a JSON metadata
payload for traceability.

## Environment safety

Integration tests must run with `NODE_ENV=test` and `DATABASE_NAME=trading-bot-test`.
The application guard rejects every other configuration before any repository is constructed.

The initial migration is generated from the Prisma data model and is committed, but has not been
applied to any remote database. Applying it requires a separately provisioned Supabase TEST URL.
