# SGiQTrader — Claude Code Context

Personal AI trading tutor for Shaun. Alpaca **paper** trading + Claude-powered
coaching, enforced trade journaling, and an adaptive curriculum. Full product
decisions live in [SPEC.md](SPEC.md) — read it before structural changes.

## The one constraint that matters

**Single-user, forever.** The personalized tutor advice and free-tier Alpaca
data are only legal/licensed because Shaun is the only user. If anyone asks to
add users, logins for friends, or public deployment: stop and flag it — that
reverses the compliance posture (Advisers Act, SEC fantasy-trading rules, data
vendor ToS). Do not build multi-user anything.

Other hard rules:
- Paper trading only. Never wire up live trading or suggest enabling it.
- The order ticket's journaling gate (thesis / planned exit / risk %) is the
  core product mechanic. Never weaken or bypass it "for convenience."
- The tutor must never present simulated results as predictive of real returns.

## Stack

- pnpm monorepo: `apps/api` (Express + node-cron, Railway), `apps/web`
  (Next.js 14 app router, Vercel), `packages/shared` (types).
- Postgres + **Drizzle migrations** (`pnpm db:generate` → `pnpm db:migrate`).
  Not prisma.
- Alpaca: separate account from DCATradeBot (one paper account per login).
  Data via free IEX feed (`feed=iex` on all data calls).
- Claude API: `@anthropic-ai/sdk`, model from `ANTHROPIC_MODEL` env
  (default `claude-opus-4-8`). All tutor calls go through
  `apps/api/src/services/tutor/client.ts` (structured outputs + zod).

## Auth model

- API: every `/api/*` route requires `x-api-key` == `API_KEY` env.
- Web: password cookie (`APP_PASSWORD`), enforced in `src/middleware.ts`.
  Browser → `/api/px/*` proxy → API; the API key never reaches the client.
- Unset `APP_PASSWORD` = open mode for local dev.

## Commands

- `pnpm typecheck` / `pnpm test` / `pnpm build` (root, all packages)
- `pnpm api` / `pnpm web` — dev servers (API :4100, web :3100)
- `pnpm db:generate` — new Drizzle migration after schema.ts changes
- `pnpm db:migrate` — apply migrations (needs DATABASE_URL)

## Conventions

- Match ThematicTradeBot patterns (zod env config, raw-fetch Alpaca client,
  pino, route/service split) — this repo deliberately mirrors it.
- Tutor prompts are per-role (planner/teacher/examiner/critic/reviewer) layered
  on a shared TUTOR_BASE in tutor/client.ts. The base carries Shaun's stated
  goal (day trading, reached through lean A → full B → gated D) and the
  direct/zero-flattery voice. Keep both when editing prompts; keep TUTOR_BASE
  stable — it's the prompt-cache prefix for all tutor calls.
- Crons run in-process with the API (worker.ts): order-sync every 10 min
  during market hours, weekly review Sunday 18:00 ET.
