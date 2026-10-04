import { describe, expect, it } from 'vitest';

import {
  InvalidTradeStateTransitionError,
  TradeStateMachine,
} from '../../src/execution/trade-state-machine.js';

describe('TradeStateMachine', () => {
  it('allows the complete paper-trade lifecycle', () => {
    const machine = new TradeStateMachine();

    for (const state of [
      'SIGNAL_DETECTED',
      'RISK_VALIDATION',
      'OPENING',
      'OPEN',
      'CLOSING',
      'CLOSED',
      'NO_POSITION',
    ] as const) {
      machine.transition(state);
    }

    expect(machine.current).toBe('NO_POSITION');
  });

  it('rejects invalid transitions', () => {
    const machine = new TradeStateMachine();

    expect(() => machine.transition('OPEN')).toThrow(InvalidTradeStateTransitionError);
  });
});
