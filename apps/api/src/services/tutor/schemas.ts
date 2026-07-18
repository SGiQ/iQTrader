import { z } from 'zod';

// Each tutor call uses structured outputs (output_config.format json_schema)
// and is re-validated with zod after parsing. Keep the JSON schemas within
// the structured-outputs limitations: no min/max, additionalProperties: false.

export const syllabusZ = z.object({
  rationale: z.string(),
  units: z.array(
    z.object({
      stage: z.enum(['A', 'B', 'C', 'D']),
      title: z.string(),
      summary: z.string(),
      lessons: z.array(
        z.object({
          title: z.string(),
          objective: z.string(),
        }),
      ),
    }),
  ),
});
export type SyllabusOutput = z.infer<typeof syllabusZ>;

export const syllabusJsonSchema = {
  type: 'object',
  properties: {
    rationale: { type: 'string' },
    units: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          stage: { type: 'string', enum: ['A', 'B', 'C', 'D'] },
          title: { type: 'string' },
          summary: { type: 'string' },
          lessons: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                objective: { type: 'string' },
              },
              required: ['title', 'objective'],
              additionalProperties: false,
            },
          },
        },
        required: ['stage', 'title', 'summary', 'lessons'],
        additionalProperties: false,
      },
    },
  },
  required: ['rationale', 'units'],
  additionalProperties: false,
} as const;

export const lessonZ = z.object({
  content_markdown: z.string(),
  exercise: z.object({
    instructions: z.string(),
    rubric: z.string(),
  }),
});
export type LessonOutput = z.infer<typeof lessonZ>;

export const lessonJsonSchema = {
  type: 'object',
  properties: {
    content_markdown: { type: 'string' },
    exercise: {
      type: 'object',
      properties: {
        instructions: { type: 'string' },
        rubric: { type: 'string' },
      },
      required: ['instructions', 'rubric'],
      additionalProperties: false,
    },
  },
  required: ['content_markdown', 'exercise'],
  additionalProperties: false,
} as const;

export const gradeZ = z.object({
  grade: z.enum(['pass', 'needs_work', 'fail']),
  feedback: z.string(),
  concepts_to_review: z.array(z.string()),
});
export type GradeOutput = z.infer<typeof gradeZ>;

export const gradeJsonSchema = {
  type: 'object',
  properties: {
    grade: { type: 'string', enum: ['pass', 'needs_work', 'fail'] },
    feedback: { type: 'string' },
    concepts_to_review: { type: 'array', items: { type: 'string' } },
  },
  required: ['grade', 'feedback', 'concepts_to_review'],
  additionalProperties: false,
} as const;

export const critiqueZ = z.object({
  critique_markdown: z.string(),
});
export type CritiqueOutput = z.infer<typeof critiqueZ>;

export const critiqueJsonSchema = {
  type: 'object',
  properties: {
    critique_markdown: { type: 'string' },
  },
  required: ['critique_markdown'],
  additionalProperties: false,
} as const;

export const weeklyReviewZ = z.object({
  narrative_markdown: z.string(),
  scorecard: z.object({
    discipline: z.number(),
    sizing: z.number(),
    journaling: z.number(),
    planAdherence: z.number(),
  }),
  focus_next_week: z.array(z.string()),
  quiz: z.array(
    z.object({
      question: z.string(),
      answer: z.string(),
    }),
  ),
});
export type WeeklyReviewOutput = z.infer<typeof weeklyReviewZ>;

export const weeklyReviewJsonSchema = {
  type: 'object',
  properties: {
    narrative_markdown: { type: 'string' },
    scorecard: {
      type: 'object',
      properties: {
        discipline: { type: 'number' },
        sizing: { type: 'number' },
        journaling: { type: 'number' },
        planAdherence: { type: 'number' },
      },
      required: ['discipline', 'sizing', 'journaling', 'planAdherence'],
      additionalProperties: false,
    },
    focus_next_week: { type: 'array', items: { type: 'string' } },
    quiz: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          question: { type: 'string' },
          answer: { type: 'string' },
        },
        required: ['question', 'answer'],
        additionalProperties: false,
      },
    },
  },
  required: ['narrative_markdown', 'scorecard', 'focus_next_week', 'quiz'],
  additionalProperties: false,
} as const;
