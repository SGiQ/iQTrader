import { Router } from 'express';
import { desc, eq } from 'drizzle-orm';
import type { QuizItem, ReviewScorecard, WeeklyReviewView } from '@sgiq/shared';
import { db, schema } from '../db/index.js';
import { runWeeklyReview } from '../services/tutor/tutor.js';

export const reviewsRouter = Router();

type ReviewRow = typeof schema.weeklyReviews.$inferSelect;

function toView(r: ReviewRow): WeeklyReviewView {
  return {
    id: r.id,
    periodStart: r.periodStart.toISOString(),
    periodEnd: r.periodEnd.toISOString(),
    narrative: r.narrative,
    scorecard: r.scorecard as ReviewScorecard,
    focusNextWeek: r.focusNextWeek as string[],
    quiz: r.quiz as QuizItem[],
    createdAt: r.createdAt.toISOString(),
  };
}

reviewsRouter.get('/', async (_req, res, next) => {
  try {
    const rows = await db
      .select()
      .from(schema.weeklyReviews)
      .orderBy(desc(schema.weeklyReviews.createdAt))
      .limit(52);
    res.json(rows.map(toView));
  } catch (err) {
    next(err);
  }
});

reviewsRouter.get('/:id', async (req, res, next) => {
  try {
    const [row] = await db
      .select()
      .from(schema.weeklyReviews)
      .where(eq(schema.weeklyReviews.id, String(req.params.id)));
    if (!row) {
      res.status(404).json({ error: 'Review not found' });
      return;
    }
    res.json(toView(row));
  } catch (err) {
    next(err);
  }
});

reviewsRouter.post('/run', async (_req, res, next) => {
  try {
    const result = await runWeeklyReview();
    res.json({ id: result.id });
  } catch (err) {
    next(err);
  }
});
