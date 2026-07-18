import { eq, inArray } from 'drizzle-orm';
import { db, schema } from '../db/index.js';
import { logger } from '../lib/logger.js';
import { alpaca } from './alpaca.js';
import { closedRoundTrip, mapAlpacaStatus } from './journal.js';
import { critiqueEntry } from './tutor/tutor.js';

// Pulls order state from Alpaca into the journal, marks linked exercises
// submitted once their trade fills, and auto-critiques closed round trips.
export async function syncOrders(): Promise<{ updated: number; critiqued: number }> {
  const pending = await db
    .select()
    .from(schema.journalEntries)
    .where(inArray(schema.journalEntries.status, ['submitted', 'partially_filled']));

  let updated = 0;
  for (const entry of pending) {
    try {
      const order = await alpaca.getOrderByClientId(entry.clientOrderId);
      const status = mapAlpacaStatus(order.status);
      if (status === entry.status && order.id === entry.alpacaOrderId) continue;
      await db
        .update(schema.journalEntries)
        .set({
          alpacaOrderId: order.id,
          status,
          filledAvgPrice: order.filled_avg_price,
          filledQty: order.filled_qty,
          filledAt: order.filled_at ? new Date(order.filled_at) : null,
        })
        .where(eq(schema.journalEntries.id, entry.id));
      updated += 1;

      if (status === 'filled' && entry.exerciseId) {
        await db
          .update(schema.exercises)
          .set({ status: 'submitted' })
          .where(eq(schema.exercises.id, entry.exerciseId));
      }
    } catch (err) {
      logger.warn({ err: String(err), clientOrderId: entry.clientOrderId }, 'Order sync failed for entry');
    }
  }

  // Critique any filled sell whose symbol is now flat.
  const positions = await alpaca.getPositions();
  const openSymbols = new Set(positions.map((p) => p.symbol));
  const uncritiquedSells = await db
    .select()
    .from(schema.journalEntries)
    .where(eq(schema.journalEntries.status, 'filled'));

  let critiqued = 0;
  for (const entry of uncritiquedSells) {
    if (!closedRoundTrip(entry, openSymbols.has(entry.symbol))) continue;
    try {
      await critiqueEntry(entry.id);
      critiqued += 1;
    } catch (err) {
      logger.error({ err: String(err), entryId: entry.id }, 'Auto-critique failed');
    }
  }

  return { updated, critiqued };
}
