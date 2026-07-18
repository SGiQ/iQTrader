import { Router } from 'express';
import { desc } from 'drizzle-orm';
import { db, schema } from '../db/index.js';

export const systemRouter = Router();

systemRouter.get('/jobs', async (_req, res, next) => {
  try {
    const rows = await db
      .select()
      .from(schema.jobRuns)
      .orderBy(desc(schema.jobRuns.startedAt))
      .limit(50);
    res.json(
      rows.map((r) => ({
        id: r.id,
        job: r.job,
        status: r.status,
        detail: r.detail,
        startedAt: r.startedAt.toISOString(),
        finishedAt: r.finishedAt?.toISOString() ?? null,
      })),
    );
  } catch (err) {
    next(err);
  }
});
