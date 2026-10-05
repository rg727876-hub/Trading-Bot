import { afterEach, describe, expect, it } from 'vitest';

import { createApiServer } from '../../src/api/server.js';
import { HistoricalDataProvider } from '../../src/market/historical-data-provider.js';
import { createCandle } from '../../src/market/candle.js';

const servers: Array<ReturnType<typeof createApiServer>> = [];

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => server.close()));
});

function createServer() {
  const server = createApiServer({
    marketDataProvider: new HistoricalDataProvider([
      createCandle({
        close: '101',
        high: '102',
        low: '99',
        open: '100',
        symbol: 'BTCUSDT',
        timeframe: '1h',
        timestamp: new Date('2026-01-01T00:00:00.000Z'),
        volume: '10',
      }),
    ]),
  });
  servers.push(server);
  return server;
}

describe('API server', () => {
  it('reports paper mode and bot status', async () => {
    const response = await createServer().inject({ method: 'GET', url: '/api/status' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ mode: 'paper', status: 'STOPPED' });
  });

  it('allows only paper bot lifecycle controls', async () => {
    const server = createServer();

    await expect(server.inject({ method: 'POST', url: '/api/bot/start' })).resolves.toMatchObject({
      statusCode: 200,
    });
    expect((await server.inject({ method: 'GET', url: '/api/status' })).json()).toEqual({
      mode: 'paper',
      status: 'RUNNING',
    });
    await server.inject({ method: 'POST', url: '/api/bot/pause' });
    expect((await server.inject({ method: 'GET', url: '/api/status' })).json()).toEqual({
      mode: 'paper',
      status: 'PAUSED',
    });
    await server.inject({ method: 'POST', url: '/api/bot/stop' });
    expect((await server.inject({ method: 'GET', url: '/api/status' })).json()).toEqual({
      mode: 'paper',
      status: 'STOPPED',
    });
  });

  it('returns virtual balance, positions, trades, performance, and historical market data', async () => {
    const server = createServer();

    expect((await server.inject({ method: 'GET', url: '/api/balance' })).json()).toEqual({
      balance: '1000',
    });
    expect((await server.inject({ method: 'GET', url: '/api/positions' })).json()).toEqual([]);
    expect((await server.inject({ method: 'GET', url: '/api/trades' })).json()).toEqual([]);
    expect((await server.inject({ method: 'GET', url: '/api/performance' })).json()).toMatchObject({
      totalTrades: 0,
    });
    expect(
      (await server.inject({ method: 'GET', url: '/api/market/BTCUSDT?timeframe=1h' })).json(),
    ).toEqual([expect.objectContaining({ close: '101', symbol: 'BTCUSDT' })]);
  });

  it('validates backtest input and executes a valid local backtest', async () => {
    const server = createServer();

    expect(
      (await server.inject({ method: 'POST', url: '/api/backtest', payload: {} })).statusCode,
    ).toBe(400);

    const response = await server.inject({
      method: 'POST',
      url: '/api/backtest',
      payload: {
        candles: [
          {
            close: '101',
            high: '102',
            low: '99',
            open: '100',
            timestamp: '2026-01-01T00:00:00.000Z',
            volume: '10',
          },
        ],
        symbol: 'BTCUSDT',
        timeframe: '1h',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ finalBalance: '1000', metrics: { totalTrades: 0 } });
  });
});
