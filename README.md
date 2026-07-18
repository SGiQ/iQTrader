# SGiQTrader

Personal AI trading tutor. Alpaca **paper trading** + a Claude-powered coach that
generates an adaptive curriculum, enforces trade journaling at the point of
order entry, grades exercises against real fill data, and runs a weekly review.

**Single-user by design** — see [SPEC.md](SPEC.md) for why that boundary matters.

## Architecture

| Piece | Tech | Deploy |
|---|---|---|
| `apps/api` | Express + node-cron + Drizzle/Postgres + Claude API | Railway |
| `apps/web` | Next.js 14 (app router) + Tailwind + lightweight-charts | Vercel |
| `packages/shared` | Shared TypeScript types | — |

Flow: browser → Next.js (`/api/px/*` proxy, cookie auth) → Express API
(`x-api-key`) → Alpaca paper account + Postgres + Claude.

## Setup

1. **Alpaca account** — create a NEW Alpaca account (not the DCATradeBot one;
   one paper account per login). Grab the paper API key/secret from the
   dashboard.
2. **Postgres** — Railway Postgres (or local for dev). Set `DATABASE_URL`.
3. **Env** — copy `.env.example` to `apps/api/.env`, fill it in. For the web
   app set `API_URL`, `API_KEY`, `APP_PASSWORD`.
4. **Install & migrate**
   ```sh
   pnpm install
   pnpm db:generate   # first time: creates the initial migration
   pnpm db:migrate
   ```
5. **Run**
   ```sh
   pnpm api   # http://localhost:4100
   pnpm web   # http://localhost:3100
   ```
6. In the app: Learn → **Generate syllabus**, then start Stage A.

## The learning loop

1. **Learn** — tutor generates lessons on demand; each lesson ends with one
   exercise to perform in the paper account.
2. **Trade** — the order ticket refuses to submit without a thesis, a planned
   exit, and a stated risk % (max 5). Optionally link the trade to an exercise.
3. **Sync & critique** — a cron syncs fills every 10 minutes during market
   hours; when a sell closes a round trip, the coach critiques it automatically.
4. **Weekly review** — Sunday 18:00 ET: pattern analysis, discipline scorecard,
   focus items, and a quiz built from the week's mistakes.

## Deploy

- **Railway** (API): repo root `railway.json` builds `@sgiq/api`; set the env
  vars from `.env.example`. Migrations run on deploy.
- **Vercel** (web): root `vercel.json`; set `API_URL`, `API_KEY`,
  `APP_PASSWORD`.

## Costs

$0 infra beyond existing Railway/Vercel accounts. Claude API tokens are the
only real spend; the weekly review is the largest single call.
