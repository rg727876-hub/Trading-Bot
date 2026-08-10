import { describe, expect, it } from 'vitest';

import { ConfigValidationError, parseEnvironment } from '../../src/config/env.js';

const developmentEnvironment = {
  DATABASE_NAME: 'trading-bot-dev',
  DATABASE_URL: 'postgresql://user:password@localhost:5432/trading-bot-dev',
  NODE_ENV: 'development',
  TRADING_MODE: 'paper',
};

describe('parseEnvironment', () => {
  it('parses a complete development configuration', () => {
    expect(parseEnvironment(developmentEnvironment)).toMatchObject({
      database: {
        name: 'trading-bot-dev',
      },
      environment: 'development',
      tradingMode: 'paper',
    });
  });

  it('parses a test configuration only when it identifies the test database', () => {
    const config = parseEnvironment({
      ...developmentEnvironment,
      DATABASE_NAME: 'trading-bot-test',
      DATABASE_URL: 'postgresql://user:password@localhost:5432/trading-bot-test',
      NODE_ENV: 'test',
    });

    expect(config.environment).toBe('test');
    expect(config.database.name).toBe('trading-bot-test');
  });

  it('rejects missing required variables', () => {
    const missingDatabaseUrl = { ...developmentEnvironment, DATABASE_URL: undefined };

    expect(() => parseEnvironment(missingDatabaseUrl)).toThrow(ConfigValidationError);
  });

  it('rejects unsupported environments', () => {
    expect(() => parseEnvironment({ ...developmentEnvironment, NODE_ENV: 'production' })).toThrow(
      ConfigValidationError,
    );
  });

  it('rejects modes other than paper trading', () => {
    expect(() => parseEnvironment({ ...developmentEnvironment, TRADING_MODE: 'live' })).toThrow(
      ConfigValidationError,
    );
  });

  it('rejects a test environment pointing to the development database', () => {
    expect(() => parseEnvironment({ ...developmentEnvironment, NODE_ENV: 'test' })).toThrow(
      ConfigValidationError,
    );
  });

  it('rejects an invalid database URL', () => {
    expect(() =>
      parseEnvironment({ ...developmentEnvironment, DATABASE_URL: 'not-a-url' }),
    ).toThrow(ConfigValidationError);
  });
});
