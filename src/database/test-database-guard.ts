import type { AppConfig } from '../config/env.js';

const TEST_DATABASE_NAME = 'trading-bot-test';

export class TestDatabaseConfigurationError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'TestDatabaseConfigurationError';
  }
}

/** Prevents integration tests from running with a non-test database configuration. */
export function assertSafeTestDatabaseConfiguration(config: AppConfig): void {
  if (config.environment !== 'test') {
    throw new TestDatabaseConfigurationError('Database integration tests require NODE_ENV=test.');
  }

  if (config.database.name !== TEST_DATABASE_NAME) {
    throw new TestDatabaseConfigurationError(
      `Database integration tests require database "${TEST_DATABASE_NAME}".`,
    );
  }
}
