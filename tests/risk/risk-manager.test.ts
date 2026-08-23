import { describe, expect, it } from 'vitest';

import { RiskManager } from '../../src/risk/risk-manager.js';

const manager = new RiskManager({ maxOpenPositions: 1, riskPerTrade: '0.01' });
const validRequest = {
  availableBalance: '1000',
  botStatus: 'RUNNING' as const,
  entryPrice: '100',
  openPositions: 0,
  quantity: '2',
  signal: { action: 'BUY' as const, symbol: 'BTCUSDT', timestamp: new Date() },
  stopLoss: '95',
};

describe('RiskManager', () => {
  it('approves a valid order at the configured 1% risk limit', () => {
    expect(manager.validate(validRequest)).toEqual({ approved: true });
  });

  it.each([
    ['INVALID_SIGNAL', { signal: { ...validRequest.signal, action: 'HOLD' as const } }],
    ['BOT_PAUSED', { botStatus: 'PAUSED' as const }],
    ['MAX_POSITIONS_REACHED', { openPositions: 1 }],
    ['INSUFFICIENT_BALANCE', { quantity: '11' }],
    ['INVALID_PRICE', { entryPrice: '0' }],
    ['INVALID_QUANTITY', { quantity: '0' }],
    ['RISK_LIMIT_EXCEEDED', { quantity: '3' }],
  ])('rejects %s', (reason, changes) => {
    expect(manager.validate({ ...validRequest, ...changes })).toEqual({ approved: false, reason });
  });
});
