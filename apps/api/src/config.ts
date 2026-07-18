import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.preprocess(
    (v) => (v === '' ? undefined : v),
    z.enum(['development', 'test', 'production']).default('development'),
  ),
  LOG_LEVEL: z.string().default('info'),

  DATABASE_URL: z.string().url(),

  ALPACA_API_KEY_ID: z.string().min(1),
  ALPACA_API_SECRET_KEY: z.string().min(1),
  ALPACA_BASE_URL: z.string().url().default('https://paper-api.alpaca.markets'),
  ALPACA_DATA_URL: z.string().url().default('https://data.alpaca.markets'),

  ANTHROPIC_API_KEY: z.string().min(1),
  ANTHROPIC_MODEL: z.string().default('claude-opus-4-8'),

  // Shared secret required as x-api-key on every non-health request.
  API_KEY: z.string().min(16),

  // PORT is injected by Railway and takes precedence over API_PORT.
  PORT: z.coerce.number().int().positive().optional(),
  API_PORT: z.coerce.number().int().positive().default(4100),
  WORKER_TIMEZONE: z.string().default('America/New_York'),
});

export type AppConfig = z.infer<typeof envSchema>;

let cached: AppConfig | null = null;

export function loadConfig(): AppConfig {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  cached = parsed.data;
  return cached;
}
