import { Router } from 'express';
import { desc, eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import type { JournalEntryView, PlaceOrderInput } from '@sgiq/shared';
import { db, schema } from '../db/index.js';
import { alpaca } from '../services/alpaca.js';
import { validateOrderInput } from '../services/journal.js';
import { syncOrders } from '../services/orderSync.js';
import { critiqueEntry } from '../services/tutor/tutor.js';

export const ordersRouter = Router();

type EntryRow = typeof schema.journalEntries.$inferSelect;

function toView(e: EntryRow): JournalEntryView {
  return {
    id: e.id,
    clientOrderId: e.clientOrderId,
    alpacaOrderId: e.alpacaOrderId,
    symbol: e.symbol,
    side: e.side,
    qty: e.qty,
    notional: e.notional,
    orderType: e.orderType,
    limitPrice: e.limitPrice,
    stopPrice: e.stopPrice,
    thesis: e.thesis,
    plannedExit: e.plannedExit,
    riskPct: e.riskPct,
    status: e.status,
    filledAvgPrice: e.filledAvgPrice,
    filledQty: e.filledQty,
    filledAt: e.filledAt?.toISOString() ?? null,
    critique: e.critique,
    critiquedAt: e.critiquedAt?.toISOString() ?? null,
    exerciseId: e.exerciseId,
    createdAt: e.createdAt.toISOString(),
  };
}

// The enforced-journal order ticket. No thesis/exit/risk — no order.
ordersRouter.post('/orders', async (req, res, next) => {
  try {
    const input = req.body as PlaceOrderInput;
    input.symbol = String(input.symbol ?? '').toUpperCase().trim();
    input.riskPct = Number(input.riskPct);

    const errors = validateOrderInput(input);
    if (errors.length > 0) {
      res.status(400).json({ errors });
      return;
    }

    const clientOrderId = `sgiq-${randomUUID()}`;
    const order = await alpaca.placeOrder({
      symbol: input.symbol,
      side: input.side,
      qty: input.qty,
      notional: input.notional,
      type: input.orderType,
      time_in_force: input.orderType === 'market' ? 'day' : 'gtc',
      client_order_id: clientOrderId,
      limit_price: input.limitPrice,
      stop_price: input.stopPrice,
    });

    const [entry] = await db
      .insert(schema.journalEntries)
      .values({
        clientOrderId,
        alpacaOrderId: order.id,
        symbol: input.symbol,
        side: input.side,
        qty: input.qty ?? null,
        notional: input.notional ?? null,
        orderType: input.orderType,
        limitPrice: input.limitPrice ?? null,
        stopPrice: input.stopPrice ?? null,
        thesis: input.thesis.trim(),
        plannedExit: input.plannedExit.trim(),
        riskPct: String(input.riskPct),
        exerciseId: input.exerciseId ?? null,
      })
      .returning();

    if (input.exerciseId) {
      await db
        .update(schema.exercises)
        .set({ journalEntryId: entry.id })
        .where(eq(schema.exercises.id, input.exerciseId));
    }

    res.status(201).json(toView(entry));
  } catch (err) {
    next(err);
  }
});

ordersRouter.get('/journal', async (_req, res, next) => {
  try {
    const rows = await db
      .select()
      .from(schema.journalEntries)
      .orderBy(desc(schema.journalEntries.createdAt))
      .limit(200);
    res.json(rows.map(toView));
  } catch (err) {
    next(err);
  }
});

ordersRouter.post('/journal/sync', async (_req, res, next) => {
  try {
    res.json(await syncOrders());
  } catch (err) {
    next(err);
  }
});

ordersRouter.post('/journal/:id/critique', async (req, res, next) => {
  try {
    const critique = await critiqueEntry(String(req.params.id));
    res.json({ critique });
  } catch (err) {
    next(err);
  }
});
