import { and, asc, desc, eq, gte, sql } from 'drizzle-orm';
import { db, schema } from '../../db/index.js';
import { alpaca } from '../alpaca.js';
import { callTutor } from './client.js';
import {
  critiqueJsonSchema,
  critiqueZ,
  gradeJsonSchema,
  gradeZ,
  lessonJsonSchema,
  lessonZ,
  syllabusJsonSchema,
  syllabusZ,
  weeklyReviewJsonSchema,
  weeklyReviewZ,
  type GradeOutput,
  type WeeklyReviewOutput,
} from './schemas.js';

type JournalEntry = typeof schema.journalEntries.$inferSelect;

function fmtEntry(e: JournalEntry): string {
  const size = e.qty ? `${e.qty} shares` : `$${e.notional} notional`;
  const fill = e.filledAvgPrice
    ? `filled ${e.filledQty ?? '?'} @ $${e.filledAvgPrice} (${e.filledAt?.toISOString() ?? 'n/a'})`
    : `status=${e.status}`;
  return [
    `- ${e.createdAt.toISOString()} ${e.side.toUpperCase()} ${e.symbol} ${size} [${e.orderType}${e.limitPrice ? ` @ $${e.limitPrice}` : ''}${e.stopPrice ? ` stop $${e.stopPrice}` : ''}] — ${fill}`,
    `  Thesis: ${e.thesis}`,
    `  Planned exit: ${e.plannedExit}`,
    `  Stated risk: ${e.riskPct}% of portfolio`,
    e.critique ? `  (already critiqued)` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

async function learnerContext(): Promise<string> {
  const completed = await db
    .select({ title: schema.lessons.title })
    .from(schema.lessons)
    .where(eq(schema.lessons.status, 'completed'));
  const recent = await db
    .select()
    .from(schema.journalEntries)
    .orderBy(desc(schema.journalEntries.createdAt))
    .limit(15);
  const lines = [
    completed.length > 0
      ? `Completed lessons: ${completed.map((l) => l.title).join('; ')}`
      : 'No lessons completed yet.',
    recent.length > 0
      ? `Recent journal entries (newest first):\n${recent.map(fmtEntry).join('\n')}`
      : 'No trades journaled yet.',
  ];
  return lines.join('\n\n');
}

export async function generateSyllabus(): Promise<{ version: number; units: number }> {
  const context = await learnerContext();
  const result = await callTutor({
    task: 'syllabus',
    prompt: `Generate (or re-plan) the full syllabus for Shaun following the four-stage skeleton. 3-5 units per stage, 2-4 lessons per unit. Lesson objectives must be concrete and testable via a paper-trade exercise or a written analysis. Front-load psychology/risk lessons inside stages A and B rather than deferring them.

Current learner state:
${context}

Return the rationale for the structure you chose (what you emphasized and why, given his state).`,
    jsonSchema: syllabusJsonSchema,
    zodSchema: syllabusZ,
  });

  const [{ maxVersion }] = await db
    .select({ maxVersion: sql<number>`coalesce(max(${schema.syllabusVersions.version}), 0)` })
    .from(schema.syllabusVersions);
  const version = Number(maxVersion) + 1;

  await db.transaction(async (tx) => {
    await tx.delete(schema.units);
    await tx.insert(schema.syllabusVersions).values({ version, rationale: result.rationale });
    let unitPos = 0;
    for (const unit of result.units) {
      unitPos += 1;
      const [row] = await tx
        .insert(schema.units)
        .values({ stage: unit.stage, position: unitPos, title: unit.title, summary: unit.summary })
        .returning({ id: schema.units.id });
      let lessonPos = 0;
      for (const lesson of unit.lessons) {
        lessonPos += 1;
        await tx.insert(schema.lessons).values({
          unitId: row.id,
          position: lessonPos,
          title: lesson.title,
          objective: lesson.objective,
        });
      }
    }
  });

  return { version, units: result.units.length };
}

export async function generateLesson(lessonId: string): Promise<void> {
  const [lesson] = await db
    .select()
    .from(schema.lessons)
    .where(eq(schema.lessons.id, lessonId));
  if (!lesson) throw new Error('Lesson not found');
  const [unit] = await db.select().from(schema.units).where(eq(schema.units.id, lesson.unitId));
  const context = await learnerContext();

  const result = await callTutor({
    task: 'lesson',
    prompt: `Write the lesson "${lesson.title}" (unit: "${unit?.title ?? 'unknown'}", stage ${unit?.stage ?? '?'}).
Objective: ${lesson.objective}

Learner state:
${context}

Write the lesson as focused markdown (concepts, worked examples using realistic numbers, common mistakes). Then design ONE exercise he performs in the paper account or as a short written analysis submitted via a trade journal entry. The exercise instructions must be specific (what to trade or analyze, what constraints, what to write in the thesis field). The rubric is for YOU to grade against later — make criteria observable from the journal entry and fill data.`,
    jsonSchema: lessonJsonSchema,
    zodSchema: lessonZ,
  });

  await db.transaction(async (tx) => {
    await tx
      .update(schema.lessons)
      .set({ content: result.content_markdown, status: 'generated', generatedAt: new Date() })
      .where(eq(schema.lessons.id, lessonId));
    await tx.insert(schema.exercises).values({
      lessonId,
      instructions: result.exercise.instructions,
      rubric: result.exercise.rubric,
    });
  });
}

export async function gradeExercise(exerciseId: string): Promise<GradeOutput> {
  const [exercise] = await db
    .select()
    .from(schema.exercises)
    .where(eq(schema.exercises.id, exerciseId));
  if (!exercise) throw new Error('Exercise not found');
  if (!exercise.journalEntryId) {
    throw new Error('No journal entry linked to this exercise yet — place the trade first');
  }
  const [entry] = await db
    .select()
    .from(schema.journalEntries)
    .where(eq(schema.journalEntries.id, exercise.journalEntryId));
  if (!entry) throw new Error('Linked journal entry not found');
  const [lesson] = await db
    .select()
    .from(schema.lessons)
    .where(eq(schema.lessons.id, exercise.lessonId));

  const result = await callTutor({
    task: 'grade',
    prompt: `Grade this exercise against your rubric. Use the actual journal entry and fill data — grade what he did, not what he meant.

Lesson: ${lesson?.title ?? 'unknown'} — ${lesson?.objective ?? ''}

Exercise instructions:
${exercise.instructions}

Rubric:
${exercise.rubric}

Journal entry + fill data:
${fmtEntry(entry)}`,
    jsonSchema: gradeJsonSchema,
    zodSchema: gradeZ,
  });

  await db
    .update(schema.exercises)
    .set({
      status: 'graded',
      grade: result.grade,
      feedback: result.feedback,
      gradedAt: new Date(),
    })
    .where(eq(schema.exercises.id, exerciseId));

  return result;
}

export async function critiqueEntry(entryId: string): Promise<string> {
  const [entry] = await db
    .select()
    .from(schema.journalEntries)
    .where(eq(schema.journalEntries.id, entryId));
  if (!entry) throw new Error('Journal entry not found');

  const history = await db
    .select()
    .from(schema.journalEntries)
    .where(eq(schema.journalEntries.symbol, entry.symbol))
    .orderBy(asc(schema.journalEntries.createdAt));

  const positions = await alpaca.getPositions();
  const pos = positions.find((p) => p.symbol === entry.symbol);

  const result = await callTutor({
    task: 'critique',
    prompt: `Critique this trade. Evaluate: thesis quality (falsifiable? or vibes?), plan adherence (did the fill and any exit match the stated plan?), sizing vs stated risk, and any psychology flags (chasing, averaging down, moving stops, revenge trading, oversized positions).

Trade under critique:
${fmtEntry(entry)}

Full ${entry.symbol} journal history:
${history.map(fmtEntry).join('\n')}

Current ${entry.symbol} position: ${pos ? `${pos.qty} @ avg $${pos.avg_entry_price}, unrealized P&L $${pos.unrealized_pl}` : 'flat (closed)'}

Return a concise markdown critique: verdict first, then evidence, then the one lesson to carry forward.`,
    jsonSchema: critiqueJsonSchema,
    zodSchema: critiqueZ,
  });

  await db
    .update(schema.journalEntries)
    .set({ critique: result.critique_markdown, critiquedAt: new Date() })
    .where(eq(schema.journalEntries.id, entryId));

  return result.critique_markdown;
}

export async function runWeeklyReview(): Promise<WeeklyReviewOutput & { id: string }> {
  const periodEnd = new Date();
  const periodStart = new Date(periodEnd.getTime() - 7 * 24 * 60 * 60 * 1000);

  const entries = await db
    .select()
    .from(schema.journalEntries)
    .where(gte(schema.journalEntries.createdAt, periodStart))
    .orderBy(asc(schema.journalEntries.createdAt));

  const account = await alpaca.getAccount();
  const positions = await alpaca.getPositions();

  const [priorReview] = await db
    .select()
    .from(schema.weeklyReviews)
    .orderBy(desc(schema.weeklyReviews.createdAt))
    .limit(1);

  const gradedThisWeek = await db
    .select()
    .from(schema.exercises)
    .where(
      and(eq(schema.exercises.status, 'graded'), gte(schema.exercises.gradedAt, periodStart)),
    );

  const result = await callTutor({
    task: 'weekly-review',
    maxTokens: 16000,
    prompt: `Run the weekly review for ${periodStart.toISOString().slice(0, 10)} to ${periodEnd.toISOString().slice(0, 10)}.

Account: portfolio value $${account.portfolio_value}, cash $${account.cash}.
Open positions: ${positions.length > 0 ? positions.map((p) => `${p.symbol} ${p.qty} @ $${p.avg_entry_price} (uPL $${p.unrealized_pl})`).join('; ') : 'none'}.

This week's journal entries:
${entries.length > 0 ? entries.map(fmtEntry).join('\n') : 'NO TRADES THIS WEEK. If lessons were also idle, address the inactivity directly — practice is the curriculum.'}

Exercises graded this week: ${gradedThisWeek.length > 0 ? gradedThisWeek.map((e) => `${e.grade}: ${e.feedback?.slice(0, 120) ?? ''}`).join(' | ') : 'none'}

${priorReview ? `Last week's focus items were: ${JSON.stringify(priorReview.focusNextWeek)}. Hold him accountable to them explicitly.` : 'This is the first weekly review.'}

Produce:
1. narrative_markdown — pattern analysis across the week (discipline, sizing, psychology, thesis quality). Verdict first. Name specific trades as evidence.
2. scorecard — 1-10 integers for discipline, sizing, journaling, planAdherence. Be stingy; 7+ must be earned.
3. focus_next_week — max 3 concrete, checkable items.
4. quiz — 3-5 questions targeting concepts this week's mistakes exposed (answers included).`,
    jsonSchema: weeklyReviewJsonSchema,
    zodSchema: weeklyReviewZ,
  });

  const [row] = await db
    .insert(schema.weeklyReviews)
    .values({
      periodStart,
      periodEnd,
      narrative: result.narrative_markdown,
      scorecard: result.scorecard,
      focusNextWeek: result.focus_next_week,
      quiz: result.quiz,
    })
    .returning({ id: schema.weeklyReviews.id });

  return { ...result, id: row.id };
}
