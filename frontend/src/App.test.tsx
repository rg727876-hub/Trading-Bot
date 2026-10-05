import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { App } from './App';
import type { DashboardApi } from './services/api';

const api: DashboardApi = {
  getDashboard: async () => ({
    balance: { balance: '1000' },
    market: [],
    performance: { maxDrawdown: '0', netPnl: '0', totalTrades: 0, winRate: '0' },
    positions: [],
    status: { mode: 'paper', status: 'STOPPED' },
    trades: [],
  }),
  setBotState: async () => ({ mode: 'paper', status: 'RUNNING' }),
};

afterEach(() => cleanup());

describe('App', () => {
  it('renders paper-trading dashboard data from the API', async () => {
    render(<App api={api} />);

    expect(await screen.findByText('Paper Trading Dashboard')).toBeInTheDocument();
    expect(screen.getByText('STOPPED')).toBeInTheDocument();
    expect(screen.getAllByText('$1000')).toHaveLength(2);
    expect(screen.getByText('No open positions')).toBeInTheDocument();
    expect(screen.getByText('No closed trades')).toBeInTheDocument();
  });

  it('requires confirmation before stopping the paper bot', async () => {
    const setBotState = vi.fn(api.setBotState);
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<App api={{ ...api, setBotState }} />);

    await screen.findByText('Paper Trading Dashboard');
    fireEvent.click(screen.getByRole('button', { name: 'Stop' }));

    expect(confirm).toHaveBeenCalledWith('Stop the paper-trading bot?');
    expect(setBotState).not.toHaveBeenCalled();
  });
});
