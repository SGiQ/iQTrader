import {
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

// Tutor-generated syllabus. One active version at a time; regenerating
// replaces units/lessons wholesale and bumps the version row.
export const syllabusVersions = pgTable('syllabus_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  version: integer('version').notNull(),
  rationale: text('rationale').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const units = pgTable('units', {
  id: uuid('id').primaryKey().defaultRandom(),
  stage: text('stage', { enum: ['A', 'B', 'C', 'D'] }).notNull(),
  position: integer('position').notNull(),
  title: text('title').notNull(),
  summary: text('summary').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const lessons = pgTable('lessons', {
  id: uuid('id').primaryKey().defaultRandom(),
  unitId: uuid('unit_id')
    .notNull()
    .references(() => units.id, { onDelete: 'cascade' }),
  position: integer('position').notNull(),
  title: text('title').notNull(),
  objective: text('objective').notNull(),
  // Markdown, null until the tutor generates it on demand.
  content: text('content'),
  status: text('status', { enum: ['available', 'generated', 'completed'] })
    .notNull()
    .default('available'),
  generatedAt: timestamp('generated_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});

export const exercises = pgTable('exercises', {
  id: uuid('id').primaryKey().defaultRandom(),
  lessonId: uuid('lesson_id')
    .notNull()
    .references(() => lessons.id, { onDelete: 'cascade' }),
  instructions: text('instructions').notNull(),
  // Grading rubric the tutor wrote for itself when it created the exercise.
  rubric: text('rubric').notNull(),
  status: text('status', { enum: ['assigned', 'submitted', 'graded'] })
    .notNull()
    .default('assigned'),
  journalEntryId: uuid('journal_entry_id'),
  grade: text('grade'),
  feedback: text('feedback'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  gradedAt: timestamp('graded_at', { withTimezone: true }),
});

// Every manual order requires a journal entry BEFORE submission — the order
// ticket refuses to submit without thesis/plannedExit/riskPct. This is the
// core learning mechanic.
export const journalEntries = pgTable('journal_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientOrderId: text('client_order_id').notNull().unique(),
  alpacaOrderId: text('alpaca_order_id'),
  symbol: text('symbol').notNull(),
  side: text('side', { enum: ['buy', 'sell'] }).notNull(),
  qty: numeric('qty'),
  notional: numeric('notional'),
  orderType: text('order_type', { enum: ['market', 'limit', 'stop'] }).notNull(),
  limitPrice: numeric('limit_price'),
  stopPrice: numeric('stop_price'),
  thesis: text('thesis').notNull(),
  plannedExit: text('planned_exit').notNull(),
  riskPct: numeric('risk_pct').notNull(),
  status: text('status', {
    enum: ['submitted', 'filled', 'partially_filled', 'canceled', 'rejected', 'expired'],
  })
    .notNull()
    .default('submitted'),
  filledAvgPrice: numeric('filled_avg_price'),
  filledQty: numeric('filled_qty'),
  filledAt: timestamp('filled_at', { withTimezone: true }),
  critique: text('critique'),
  critiquedAt: timestamp('critiqued_at', { withTimezone: true }),
  exerciseId: uuid('exercise_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const weeklyReviews = pgTable('weekly_reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
  periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),
  narrative: text('narrative').notNull(),
  scorecard: jsonb('scorecard').notNull(),
  focusNextWeek: jsonb('focus_next_week').notNull(),
  quiz: jsonb('quiz').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const watchlist = pgTable('watchlist', {
  id: uuid('id').primaryKey().defaultRandom(),
  symbol: text('symbol').notNull().unique(),
  note: text('note'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const jobRuns = pgTable('job_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  job: text('job').notNull(),
  status: text('status', { enum: ['running', 'success', 'error'] }).notNull(),
  detail: text('detail'),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
});
