# Dashboard

The React + Vite dashboard lives in `frontend/`. It displays only paper-trading state from the
local API: bot status, virtual balance/equity, P&L, win rate, drawdown, positions, recent trades,
the latest market price, and a candlestick chart when historical candles are available.

```bash
npm --prefix frontend install
npm run dev                 # API at 127.0.0.1:3000
npm run dashboard:dev       # dashboard at Vite's local address
```

The Vite development server proxies `/api` to `http://127.0.0.1:3000`. Stop asks for browser
confirmation before changing the local paper-bot state. The dashboard never contains exchange
credentials or live-order controls.
