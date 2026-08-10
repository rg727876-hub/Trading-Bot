import { describe, expect, it } from 'vitest';

import type { AppConfig } from '../../src/config/env.js';
import {
  TestDatabaseConfigurationError,
  assertSafeTestDatabaseConfiguration,
} from '../../src/database/test-database-guard.js';

const testConfig: AppConfig = {
  database: {
    name: 'trading-bot-test',
    url: 'postgresql://user:password@localhost:5432/trading-bot-test',
  },
  environment: 'test',
  tradingMode: 'paper',
};

describe('assertSafeTestDatabaseConfiguration', () => {
  it('accepts the dedicated test environment and database', () => {
    expect(() => assertSafeTestDatabaseConfiguration(testConfig)).not.toThrow();
  });

  it('rejects a development configuration', () => {
    expect(() =>
      assertSafeTestDatabaseConfiguration({
        ...testConfig,
        database: { ...testConfig.database, name: 'trading-bot-dev' },
        environment: 'development',
      }),
    ).toThrow(TestDatabaseConfigurationError);
  });

  it('rejects a test configuration with an unexpected database name', () => {
    expect(() =>
      assertSafeTestDatabaseConfiguration({
        ...testConfig,
        database: { ...testConfig.database, name: 'another-database' },
      }),
    ).toThrow(TestDatabaseConfigurationError);
  });
});
