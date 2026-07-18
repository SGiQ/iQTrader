import { eq } from 'drizzle-orm';
import { db, schema } from '../db/index.js';
import { logger } from '../lib/logger.js';

export async function withJobRun<T>(job: string, fn: () => Promise<T>): Promise<T | null> {
  const [row] = await db
    .insert(schema.jobRuns)
    .values({ job, status: 'running' })
    .returning({ id: schema.jobRuns.id });
  try {
    const result = await fn();
    await db
      .update(schema.jobRuns)
      .set({ status: 'success', detail: JSON.stringify(result).slice(0, 2000), finishedAt: new Date() })
      .where(eq(schema.jobRuns.id, row.id));
    return result;
  } catch (err) {
    logger.error({ err: String(err), job }, 'Job failed');
    await db
      .update(schema.jobRuns)
      .set({ status: 'error', detail: String(err).slice(0, 2000), finishedAt: new Date() })
      .where(eq(schema.jobRuns.id, row.id));
    return null;
  }
}
