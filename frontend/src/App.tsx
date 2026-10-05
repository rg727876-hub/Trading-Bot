import { type ReactNode, useEffect, useState } from 'react';

import { CandleChart } from './components/CandleChart';
import {
  createDashboardApi,
  type DashboardApi,
  type DashboardData,
  type PositionDto,
  type TradeDto,
} from './services/api';
import './styles.css';

export function App({ api = createDashboardApi() }: { api?: DashboardApi }) {
  const [data, setData] = useState<DashboardData>();
  const [error, setError] = useState<string>();

  const refresh = async () => {
    try {
      setError(undefined);
      setData(await api.getDashboard());
    } catch {
      setError('Unable to load the paper-trading dashboard.');
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const setBotState = async (action: 'start' | 'pause' | 'stop') => {
    if (action === 'stop' && !window.confirm('Stop the paper-trading bot?')) return;
    try {
      await api.setBotState(action);
      await refresh();
    } catch {
      setError('Unable to update paper-trading bot status.');
    }
  };

  if (data === undefined && error === undefined)
    return <p className="loading">Loading dashboard…</p>;
  if (data === undefined) return <p className="error">{error}</p>;

  const latestPrice = data.market.at(-1)?.close ?? '—';
  return (
    <main>
      <header>
        <div>
          <p className="eyebrow">Experimental — no real orders</p>
          <h1>Paper Trading Dashboard</h1>
        </div>
        <div className="controls" aria-label="Bot controls">
          <button onClick={() => void setBotState('start')}>Start</button>
          <button onClick={() => void setBotState('pause')}>Pause</button>
          <button className="danger" onClick={() => void setBotState('stop')}>
            Stop
          </button>
        </div>
      </header>
      {error === undefined ? null : <p className="error">{error}</p>}

      <section className="summary" aria-label="Bot summary">
        <Metric label="Bot Status" value={data.status.status} />
        <Metric label="Trading Mode" value={data.status.mode.toUpperCase()} />
        <Metric label="Balance" value={money(data.balance.balance)} />
        <Metric label="Equity" value={money(data.balance.balance)} />
        <Metric label="P&amp;L" value={money(data.performance.netPnl)} />
        <Metric label="Win Rate" value={percent(data.performance.winRate)} />
        <Metric label="Drawdown" value={money(data.performance.maxDrawdown)} />
        <Metric label="Market Price" value={money(latestPrice)} />
        <Metric label="Current Signal" value="Not evaluated" />
      </section>

      <section className="panel">
        <h2>BTCUSDT — 1h candles</h2>
        <CandleChart candles={data.market} />
      </section>
      <section className="columns">
        <DataPanel title="Open Positions">
          <Positions positions={data.positions} />
        </DataPanel>
        <DataPanel title="Recent Trades">
          <Trades trades={data.trades} />
        </DataPanel>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function DataPanel({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="panel">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function Positions({ positions }: { positions: readonly PositionDto[] }) {
  if (positions.length === 0) return <p className="empty">No open positions</p>;
  return (
    <ul>
      {positions.map((position) => (
        <li key={position.id}>
          {position.symbol}: {position.quantity} @ {position.entryPrice}
        </li>
      ))}
    </ul>
  );
}

function Trades({ trades }: { trades: readonly TradeDto[] }) {
  if (trades.length === 0) return <p className="empty">No closed trades</p>;
  return (
    <ul>
      {trades.map((trade) => (
        <li key={trade.id}>
          {trade.symbol}: {money(trade.profitLoss)} ({trade.exitReason})
        </li>
      ))}
    </ul>
  );
}

function money(value: string): string {
  return value === '—' ? value : `$${value}`;
}

function percent(value: string): string {
  return `${(Number(value) * 100).toFixed(2)}%`;
}
