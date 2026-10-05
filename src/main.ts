import pino from 'pino';

import { createApiServer } from './api/server.js';
import { getRuntimeMode } from './runtime-mode.js';

const logger = pino({
  name: 'trading-bot',
});

async function main(): Promise<void> {
  const port = Number(process.env.PORT ?? '3000');
  if (!Number.isInteger(port) || port <= 0 || port > 65_535) {
    throw new Error('PORT must be a valid TCP port.');
  }

  const app = createApiServer();
  await app.listen({ host: '127.0.0.1', port });
  logger.info(
    { event: 'API_STARTED', mode: getRuntimeMode(), port },
    'Paper trading API initialized',
  );
}

void main().catch((error: unknown) => {
  logger.error({ error, event: 'API_START_FAILED' }, 'Paper trading API failed to start');
  process.exitCode = 1;
});
