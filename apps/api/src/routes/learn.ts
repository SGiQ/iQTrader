import { Router } from 'express';
import { asc, desc, eq, inArray } from 'drizzle-orm';
import type { ExerciseView, LessonView, UnitView } from '@sgiq/shared';
import { db, schema } from '../db/index.js';
import { generateLesson, generateSyllabus, gradeExercise } from '../services/tutor/tutor.js';

export const learnRouter = Router();

type ExerciseRow = typeof schema.exercises.$inferSelect;

function exerciseView(e: ExerciseRow): ExerciseView {
  return {
    id: e.id,
    lessonId: e.lessonId,
    instructions: e.instructions,
    rubric: e.rubric,
    status: e.status,
    journalEntryId: e.journalEntryId,
    grade: e.grade,
    feedback: e.feedback,
    createdAt: e.createdAt.toISOString(),
    gradedAt: e.gradedAt?.toISOString() ?? null,
  };
}

learnRouter.get('/syllabus', async (_req, res, next) => {
  try {
    const [version] = await db
      .select()
      .from(schema.syllabusVersions)
      .orderBy(desc(schema.syllabusVersions.version))
      .limit(1);
    const units = await db
      .select()
      .from(schema.units)
      .orderBy(asc(schema.units.position));
    const lessons = units.length
      ? await db
          .select()
          .from(schema.lessons)
          .where(inArray(schema.lessons.unitId, units.map((u) => u.id)))
          .orderBy(asc(schema.lessons.position))
      : [];

    const view: UnitView[] = units.map((u) => ({
      id: u.id,
      stage: u.stage,
      position: u.position,
      title: u.title,
      summary: u.summary,
      lessons: lessons
        .filter((l) => l.unitId === u.id)
        .map((l) => ({
          id: l.id,
          position: l.position,
          title: l.title,
          objective: l.objective,
          status: l.status,
        })),
    }));

    res.json({
      version: version?.version ?? 0,
      rationale: version?.rationale ?? null,
      units: view,
    });
  } catch (err) {
    next(err);
  }
});

learnRouter.post('/syllabus/generate', async (_req, res, next) => {
  try {
    res.json(await generateSyllabus());
  } catch (err) {
    next(err);
  }
});

learnRouter.get('/lessons/:id', async (req, res, next) => {
  try {
    const [lesson] = await db
      .select()
      .from(schema.lessons)
      .where(eq(schema.lessons.id, String(req.params.id)));
    if (!lesson) {
      res.status(404).json({ error: 'Lesson not found' });
      return;
    }
    const exercises = await db
      .select()
      .from(schema.exercises)
      .where(eq(schema.exercises.lessonId, lesson.id))
      .orderBy(asc(schema.exercises.createdAt));

    const view: LessonView = {
      id: lesson.id,
      unitId: lesson.unitId,
      position: lesson.position,
      title: lesson.title,
      objective: lesson.objective,
      status: lesson.status,
      content: lesson.content,
      exercises: exercises.map(exerciseView),
    };
    res.json(view);
  } catch (err) {
    next(err);
  }
});

learnRouter.post('/lessons/:id/generate', async (req, res, next) => {
  try {
    await generateLesson(String(req.params.id));
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

learnRouter.post('/lessons/:id/complete', async (req, res, next) => {
  try {
    await db
      .update(schema.lessons)
      .set({ status: 'completed', completedAt: new Date() })
      .where(eq(schema.lessons.id, String(req.params.id)));
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

learnRouter.post('/exercises/:id/grade', async (req, res, next) => {
  try {
    res.json(await gradeExercise(String(req.params.id)));
  } catch (err) {
    next(err);
  }
});

// Open exercises the trade ticket can attach an order to.
learnRouter.get('/exercises/open', async (_req, res, next) => {
  try {
    const rows = await db
      .select()
      .from(schema.exercises)
      .where(inArray(schema.exercises.status, ['assigned', 'submitted']))
      .orderBy(desc(schema.exercises.createdAt));
    res.json(rows.map(exerciseView));
  } catch (err) {
    next(err);
  }
});
