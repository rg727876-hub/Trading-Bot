export type TradeState =
  'NO_POSITION' | 'SIGNAL_DETECTED' | 'RISK_VALIDATION' | 'OPENING' | 'OPEN' | 'CLOSING' | 'CLOSED';

const validTransitions: Record<TradeState, readonly TradeState[]> = {
  CLOSED: ['NO_POSITION'],
  CLOSING: ['CLOSED'],
  NO_POSITION: ['SIGNAL_DETECTED'],
  OPEN: ['CLOSING'],
  OPENING: ['OPEN'],
  RISK_VALIDATION: ['OPENING'],
  SIGNAL_DETECTED: ['RISK_VALIDATION'],
};

export class InvalidTradeStateTransitionError extends Error {
  public constructor(from: TradeState, to: TradeState) {
    super(`Cannot transition paper trade state from ${from} to ${to}.`);
    this.name = 'InvalidTradeStateTransitionError';
  }
}

export class TradeStateMachine {
  private state: TradeState = 'NO_POSITION';

  public get current(): TradeState {
    return this.state;
  }

  public transition(next: TradeState): void {
    if (!validTransitions[this.state].includes(next)) {
      throw new InvalidTradeStateTransitionError(this.state, next);
    }
    this.state = next;
  }
}
