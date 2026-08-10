import { config as loadDotenv } from 'dotenv';

import { type AppConfig, type AppEnvironment, parseEnvironment } from './env.js';

export function loadConfiguration(environment: AppEnvironment): AppConfig {
  loadDotenv({ path: `.env.${environment}` });

  return parseEnvironment(process.env);
}
