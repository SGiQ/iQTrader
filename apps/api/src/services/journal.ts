import type { PlaceOrderInput } from '@sgiq/shared';

// The enforced-journal rules. Pure functions so they're unit-testable.

export const MIN_THESIS_CHARS = 30;
export const MIN_EXIT_CHARS = 10;
export const MAX_RISK_PCT = 5;

export function validateOrderInput(input: PlaceOrderInput): string[] {
  const errors: string[] = [];

  if (!/^[A-Z]{1,5}$/.test(input.symbol)) {
    errors.push('Symbol must be 1-5 uppercase letters');
  }
  if (!input.qty && !input.notional) {
    errors.push('Provide qty or notional');
  }
  if (input.qty && input.notional) {
    errors.push('Provide exactly one of qty or notional');
  }
  if (input.qty && !(Number(input.qty) > 0)) {
    errors.push('qty must be a positive number');
  }
  if (input.notional && !(Number(input.notional) > 0)) {
    errors.push('notional must be a positive number');
  }
  if (input.orderType === 'limit' && !(Number(input.limitPrice) > 0)) {
    errors.push('Limit orders require a positive limitPrice');
  }
  if (input.orderType === 'stop' && !(Number(input.stopPrice) > 0)) {
    errors.push('Stop orders require a positive stopPrice');
  }

  // The journaling gate: no thesis, no exit plan, no stated risk — no order.
  if (!input.thesis || input.thesis.trim().length < MIN_THESIS_CHARS) {
    errors.push(`Thesis is required (at least ${MIN_THESIS_CHARS} characters). Why this trade, why now?`);
  }
  if (!input.plannedExit || input.plannedExit.trim().length < MIN_EXIT_CHARS) {
    errors.push(`Planned exit is required (at least ${MIN_EXIT_CHARS} characters). Price or condition, decided before entry.`);
  }
  if (!(input.riskPct > 0)) {
    errors.push('riskPct must be greater than 0');
  }
  if (input.riskPct > MAX_RISK_PCT) {
    errors.push(`riskPct capped at ${MAX_RISK_PCT}% — size down`);
  }

  return errors;
}

export type JournalStatus =
  | 'submitted'
  | 'filled'
  | 'partially_filled'
  | 'canceled'
  | 'rejected'
  | 'expired';

// Alpaca order lifecycle → journal status. Anything still working stays 'submitted'.
export function mapAlpacaStatus(alpacaStatus: string): JournalStatus {
  switch (alpacaStatus) {
    case 'filled':
      return 'filled';
    case 'partially_filled':
      return 'partially_filled';
    case 'canceled':
    case 'done_for_day':
      return 'canceled';
    case 'rejected':
      return 'rejected';
    case 'expired':
      return 'expired';
    default:
      return 'submitted';
  }
}

// A filled SELL with no remaining position in that symbol closed a round trip —
// that's the moment the coach critiques it.
export function closedRoundTrip(
  entry: { side: 'buy' | 'sell'; status: string; critique: string | null },
  hasOpenPosition: boolean,
): boolean {
  return entry.side === 'sell' && entry.status === 'filled' && !hasOpenPosition && !entry.critique;
}
