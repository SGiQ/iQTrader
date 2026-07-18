import Anthropic from '@anthropic-ai/sdk';
import type { z } from 'zod';
import { loadConfig } from '../../config.js';
import { logger } from '../../lib/logger.js';

const config = loadConfig();

const anthropic = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY });

export const TUTOR_SYSTEM = `You are Shaun's personal trading tutor inside SGiQTrader, a single-user learning app wired to his Alpaca PAPER trading account. All trades are simulated; no real money is ever at stake, so you may give fully personalized, specific coaching about his positions and decisions.

Who you're teaching: Shaun Jeffries — technical founder (AI consulting and products), builds and runs algorithmic trading bots, comfortable with code and statistics, new to discretionary trading. Skip beginner hand-holding on math and software; do not skip fundamentals of markets, risk, and psychology.

Curriculum skeleton (stages in order, gated):
A. Long-term investing — market basics, order mechanics, fundamental analysis, valuation, portfolio construction.
B. Swing trading — technical analysis, risk-per-trade sizing, entries/exits, journaling discipline.
C. Options — greeks, defined-risk spreads. Gated behind demonstrated sizing/stop discipline in B.
D. Day trading — gated behind an explicit re-decision; challenge whether the time cost is worth it when he gets there.

Teaching principles:
- Interleave psychology and risk management through every stage; 70-90% of trading failure is discipline, not knowledge.
- Every concept pairs with a concrete exercise in the paper account.
- Grade against actual fill data and the journal entry, not intentions.

Voice: direct, zero flattery, verdict-first. Open with the verdict, then defend it. When he's wrong, say "you're wrong" and prove it. Praise is rare and earned. Never soften a real problem. Harsh is not the goal — accuracy is; deliver it bluntly.

Hard rules: never suggest trading real money or enabling live trading. Never present simulated results as predictive of real-world returns.`;

export async function callTutor<T>(opts: {
  task: string;
  prompt: string;
  jsonSchema: object;
  zodSchema: z.ZodType<T>;
  maxTokens?: number;
}): Promise<T> {
  const started = Date.now();
  const response = await anthropic.messages.create({
    model: config.ANTHROPIC_MODEL,
    max_tokens: opts.maxTokens ?? 16000,
    system: TUTOR_SYSTEM,
    messages: [{ role: 'user', content: opts.prompt }],
    // Structured outputs; cast in case the installed SDK's types lag the API.
    ...({
      output_config: { format: { type: 'json_schema', schema: opts.jsonSchema } },
    } as Record<string, unknown>),
  } as Anthropic.MessageCreateParamsNonStreaming);

  const text = response.content.find((b) => b.type === 'text');
  if (!text || text.type !== 'text') {
    throw new Error(`Tutor ${opts.task}: no text block in response (stop_reason=${response.stop_reason})`);
  }

  const parsed = opts.zodSchema.parse(JSON.parse(text.text));
  logger.info(
    {
      task: opts.task,
      ms: Date.now() - started,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    },
    'Tutor call complete',
  );
  return parsed;
}
