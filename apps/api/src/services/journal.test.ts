import { describe, expect, it } from 'vitest';
import type { PlaceOrderInput } from '@sgiq/shared';
import { closedRoundTrip, mapAlpacaStatus, validateOrderInput } from './journal.js';

const validInput: PlaceOrderInput = {
  symbol: 'AAPL',
  side: 'buy',
  qty: '10',
  orderType: 'market',
  thesis: 'Breakout above 50-day SMA on above-average volume after earnings beat.',
  plannedExit: 'Stop at $180, target $205, or exit if it closes below the 50-day.',
  riskPct: 1,
};

describe('validateOrderInput — the journaling gate', () => {
  it('accepts a fully-journaled order', () => {
    expect(validateOrderInput(validInput)).toEqual([]);
  });

  it('rejects a missing thesis', () => {
    const errors = validateOrderInput({ ...validInput, thesis: '' });
    expect(errors.some((e) => e.includes('Thesis'))).toBe(true);
  });

  it('rejects a too-short thesis (no drive-by journaling)', () => {
    const errors = validateOrderInput({ ...validInput, thesis: 'looks good' });
    expect(errors.some((e) => e.includes('Thesis'))).toBe(true);
  });

  it('rejects a missing planned exit', () => {
    const errors = validateOrderInput({ ...validInput, plannedExit: '' });
    expect(errors.some((e) => e.includes('Planned exit'))).toBe(true);
  });

  it('rejects zero and negative risk', () => {
    expect(validateOrderInput({ ...validInput, riskPct: 0 }).length).toBeGreaterThan(0);
    expect(validateOrderInput({ ...validInput, riskPct: -1 }).length).toBeGreaterThan(0);
  });

  it('caps risk at 5%', () => {
    const errors = validateOrderInput({ ...validInput, riskPct: 7 });
    expect(errors.some((e) => e.includes('capped'))).toBe(true);
  });

  it('rejects both qty and notional', () => {
    const errors = validateOrderInput({ ...validInput, notional: '500' });
    expect(errors.some((e) => e.includes('exactly one'))).toBe(true);
  });

  it('rejects neither qty nor notional', () => {
    const errors = validateOrderInput({ ...validInput, qty: undefined });
    expect(errors.some((e) => e.includes('qty or notional'))).toBe(true);
  });

  it('requires limitPrice on limit orders', () => {
    const errors = validateOrderInput({ ...validInput, orderType: 'limit' });
    expect(errors.some((e) => e.includes('limitPrice'))).toBe(true);
  });

  it('requires stopPrice on stop orders', () => {
    const errors = validateOrderInput({ ...validInput, orderType: 'stop' });
    expect(errors.some((e) => e.includes('stopPrice'))).toBe(true);
  });

  it('rejects malformed symbols', () => {
    expect(validateOrderInput({ ...validInput, symbol: 'TOOLONG' }).length).toBeGreaterThan(0);
    expect(validateOrderInput({ ...validInput, symbol: 'aapl' }).length).toBeGreaterThan(0);
    expect(validateOrderInput({ ...validInput, symbol: '' }).length).toBeGreaterThan(0);
  });
});

describe('mapAlpacaStatus', () => {
  it('maps terminal states', () => {
    expect(mapAlpacaStatus('filled')).toBe('filled');
    expect(mapAlpacaStatus('partially_filled')).toBe('partially_filled');
    expect(mapAlpacaStatus('canceled')).toBe('canceled');
    expect(mapAlpacaStatus('rejected')).toBe('rejected');
    expect(mapAlpacaStatus('expired')).toBe('expired');
  });

  it('keeps working orders as submitted', () => {
    expect(mapAlpacaStatus('new')).toBe('submitted');
    expect(mapAlpacaStatus('accepted')).toBe('submitted');
    expect(mapAlpacaStatus('pending_new')).toBe('submitted');
  });
});

describe('closedRoundTrip — critique trigger', () => {
  it('fires for a filled sell with no remaining position and no critique', () => {
    expect(closedRoundTrip({ side: 'sell', status: 'filled', critique: null }, false)).toBe(true);
  });

  it('does not fire while the position is still open', () => {
    expect(closedRoundTrip({ side: 'sell', status: 'filled', critique: null }, true)).toBe(false);
  });

  it('does not fire for buys', () => {
    expect(closedRoundTrip({ side: 'buy', status: 'filled', critique: null }, false)).toBe(false);
  });

  it('does not fire for unfilled sells', () => {
    expect(closedRoundTrip({ side: 'sell', status: 'submitted', critique: null }, false)).toBe(false);
  });

  it('does not re-critique', () => {
    expect(closedRoundTrip({ side: 'sell', status: 'filled', critique: 'done' }, false)).toBe(false);
  });
});
