import { describe, expect, it } from 'vitest';

import { getRuntimeMode } from '../src/runtime-mode.js';

describe('getRuntimeMode', () => {
  it('defaults to the only permitted execution mode: paper', () => {
    expect(getRuntimeMode()).toBe('paper');
  });
});
