import { Router } from 'express';
import { asc, eq } from 'drizzle-orm';
import { db, schema } from '../db/index.js';

export const watchlistRouter = Router();

watchlistRouter.get('/', async (_req, res, next) => {
  try {
    const rows = await db.select().from(schema.watchlist).orderBy(asc(schema.watchlist.symbol));
    res.json(
      rows.map((r) => ({
        id: r.id,
        symbol: r.symbol,
        note: r.note,
        createdAt: r.createdAt.toISOString(),
      })),
    );
  } catch (err) {
    next(err);
  }
});

watchlistRouter.post('/', async (req, res, next) => {
  try {
    const symbol = String(req.body?.symbol ?? '').toUpperCase().trim();
    if (!/^[A-Z]{1,5}$/.test(symbol)) {
      res.status(400).json({ error: 'Symbol must be 1-5 uppercase letters' });
      return;
    }
    const note = req.body?.note ? String(req.body.note) : null;
    const [row] = await db
      .insert(schema.watchlist)
      .values({ symbol, note })
      .onConflictDoUpdate({ target: schema.watchlist.symbol, set: { note } })
      .returning();
    res.status(201).json({ id: row.id, symbol: row.symbol, note: row.note, createdAt: row.createdAt.toISOString() });
  } catch (err) {
    next(err);
  }
});

watchlistRouter.delete('/:id', async (req, res, next) => {
  try {
    await db.delete(schema.watchlist).where(eq(schema.watchlist.id, String(req.params.id)));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
