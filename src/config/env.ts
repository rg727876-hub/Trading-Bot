import { z } from 'zod';

const databaseNameByEnvironment = {
  development: 'trading-bot-dev',
  test: 'trading-bot-test',
} as const;

const environmentSchema = z.object({
  DATABASE_NAME: z.string().min(1),
  DATABASE_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'test']),
  TRADING_MODE: z.literal('paper'),
});

export type AppEnvironment = keyof typeof databaseNameByEnvironment;

export interface AppConfig {
  database: {
    name: string;
    url: string;
  };
  environment: AppEnvironment;
  tradingMode: 'paper';
}

export class ConfigValidationError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'ConfigValidationError';
  }
}

export function parseEnvironment(environment: Record<string, string | undefined>): AppConfig {
  const parsed = environmentSchema.safeParse(environment);

  if (!parsed.success) {
    throw new ConfigValidationError(`Invalid environment configuration: ${parsed.error.message}`);
  }

  const expectedDatabaseName = databaseNameByEnvironment[parsed.data.NODE_ENV];
  if (parsed.data.DATABASE_NAME !== expectedDatabaseName) {
    throw new ConfigValidationError(
      `Environment "${parsed.data.NODE_ENV}" must use database "${expectedDatabaseName}".`,
    );
  }

  return {
    database: {
      name: parsed.data.DATABASE_NAME,
      url: parsed.data.DATABASE_URL,
    },
    environment: parsed.data.NODE_ENV,
    tradingMode: parsed.data.TRADING_MODE,
  };
}
