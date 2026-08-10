import pino from 'pino';

import { getRuntimeMode } from './runtime-mode.js';

const logger = pino({
  name: 'trading-bot',
});

logger.info(
  { event: 'APPLICATION_BOOTSTRAPPED', mode: getRuntimeMode() },
  'Trading bot initialized',
);
