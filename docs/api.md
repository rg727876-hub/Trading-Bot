# REST API

The Fastify API runs locally at `http://127.0.0.1:3000` by default. `PORT` can change the local
listening port. It exposes only paper-trading state and does not contain exchange credentials or
order submission code.

| Method | Endpoint                           | Purpose                              |
| ------ | ---------------------------------- | ------------------------------------ |
| GET    | `/api/status`                      | Bot status and paper mode            |
| GET    | `/api/balance`                     | Virtual balance                      |
| GET    | `/api/positions`                   | Open paper positions                 |
| GET    | `/api/trades`                      | Closed simulated trades              |
| GET    | `/api/performance`                 | Calculated performance metrics       |
| GET    | `/api/market/:symbol?timeframe=1h` | Historical market candles            |
| POST   | `/api/bot/start`                   | Set local paper bot state to running |
| POST   | `/api/bot/pause`                   | Set local paper bot state to paused  |
| POST   | `/api/bot/stop`                    | Set local paper bot state to stopped |
| POST   | `/api/backtest`                    | Run a local historical backtest      |

`POST /api/backtest` accepts a symbol, timeframe, and an array of OHLCV candle payloads. Zod
validates the request shape; candle construction then validates market values before backtesting.
