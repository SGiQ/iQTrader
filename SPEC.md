# SGiQTrader — Personal AI Trading Tutor

A single-user app for Shaun to learn trading through an AI tutor wired to a real
paper-trading account. Not a product. Not public. One user, forever — see
"Hard boundary" below.

## Purpose

Learn to trade well, with a tutor that:
1. Generates and maintains a personal syllabus (not hand-authored, not licensed content).
2. Pairs every concept with a live exercise in the paper account.
3. Grades exercises against actual Alpaca fill data.
4. Reviews the trade journal weekly and adapts the syllabus to observed mistakes.

Trading psychology and risk management are interleaved through every stage, not
saved for a late module — research consistently attributes 70–90% of trading
failure to discipline, not knowledge.

## Hard boundary: single-user only

While this app has exactly one user (Shaun), none of the public-app constraints
apply: no SEC fantasy-trading exposure, no Advisers Act exposure, no disclaimers,
and free-tier market data is properly licensed (personal use). The tutor MAY give
fully personalized advice ("your portfolio is overconcentrated, cut position X").

**The day anyone else gets a login, all of that reverses.** Personalized
recommendations become Advisers Act territory, free data tiers become ToS
violations, and simulated-trading competitions become SEC territory. Do not add
multi-user support without a deliberate re-scope. This is the single most
important constraint in the project.

## Learning scope (staged — order is deliberate)

| Stage | Track | Gate to advance |
|---|---|---|
| A | Long-term investing — market basics, order mechanics, fundamental analysis, valuation, portfolio construction, diversification | Tutor-assessed concept mastery + completed exercises |
| B | Swing trading — technical analysis, risk-per-trade sizing, entries/exits, journaling discipline | Sustained journal quality + risk-rule adherence over N trades |
| C | Options — greeks, defined-risk spreads (Alpaca paper supports options) | Demonstrated sizing/stop discipline from Stage B |
| D | Day trading — intraday, real-time data | Explicit re-decision: time cost is high; reassess whether it's still wanted |

The tutor treats this as a skeleton, not a script — it expands stages into
lessons/exercises dynamically and re-sequences based on journal evidence.

## Architecture

Standard SGiQ stack (ThematicTradeBot pattern). No Firebase.

| Layer | Choice | Notes |
|---|---|---|
| Frontend | Next.js on Vercel | TradingView lightweight-charts for charting |
| API + worker | Express + node-cron on Railway, TypeScript | Single service, same repo layout as ThematicTradeBot |
| DB | Postgres + Drizzle on Railway | Drizzle migrations (NOT prisma db push) |
| Edge | Cloudflare DNS | |
| Auth | Basic Auth, single user | DCATradeBot pattern. No signup flow, no Clerk/NextAuth |
| Market data + fills | Alpaca paper account, free IEX real-time feed | Key lives server-side on Railway only |
| Tutor | Claude API | Model configurable via env; default to latest Sonnet, escalate to top tier for weekly reviews |

**Alpaca account:** one paper account per Alpaca account, and DCATradeBot already
occupies the existing one. Create a SEPARATE Alpaca account for this app
(shaunjgov1@gmail.com — the established test/operator identity) so tutor trades
never mix with the DCA bot's ledger.

## Core modules

### 1. Tutor engine
- Generates the syllabus (stages → units → lessons) on first run; persisted in
  Postgres, versioned when re-planned.
- Lesson delivery on demand: concept explanation + a concrete exercise in the
  paper account ("place a limit buy 2% below market on a stock from your
  watchlist; state your thesis and your exit before submitting").
- Exercise grading: pulls the actual order/fill from Alpaca and evaluates
  against the exercise's rubric.
- Tutor voice: direct, zero flattery, verdict-first (per Shaun's global working
  style). Praise only when earned.

### 2. Order ticket with enforced journaling
- Market / limit / stop orders against the paper account.
- The ticket REQUIRES before submit: thesis (why), planned exit (price or
  condition), and risk % of portfolio. No journal entry, no order.
- On position close, the coach critiques the round trip: thesis vs outcome,
  plan adherence, sizing.

### 3. Portfolio view
- Positions, P&L, order history, watchlist — read from Alpaca, journal overlay
  from Postgres.

### 4. Weekly coach review (cron, Sunday evening ET)
- Pulls the week's orders, fills, and journal entries.
- Claude produces: pattern analysis (discipline, sizing, psychology),
  a discipline scorecard, next week's focus, and a short quiz on concepts the
  week's mistakes surfaced.
- Review stored; syllabus re-planned if the review warrants it.

### 5. Historical replay — PHASE 2, not MVP
- Mini sim engine over Alpaca historical bars: pick a period (e.g., Mar 2020,
  2022 drawdown), bars replay forward, trade it without hindsight.
- This is the one place a custom fill engine is needed (Alpaca paper only
  trades the live market). Simple fills against replayed bar prices; ledger in
  Postgres.

## Data model (sketch)

- `syllabus` / `units` / `lessons` (generated content, status, version)
- `exercises` (lesson_id, rubric, linked alpaca order id, grade, feedback)
- `journal_entries` (alpaca order id, thesis, planned_exit, risk_pct,
  close critique)
- `weekly_reviews` (period, scorecard JSON, narrative, quiz + answers)
- `watchlist`

## MVP cut-line

**In:** tutor engine (Stage A + B content generation), enforced-journal order
ticket, portfolio view, weekly review cron, watchlist.
**Out (later):** historical replay, options module (Stage C), day-trading
support/real-time UI polish (Stage D), NIA `/api/nia/*` service-key endpoint +
dashboard pill, quizzes with spaced repetition.

## Costs

$0 infra beyond existing Railway/Vercel accounts (free/hobby tiers cover a
single user). Claude API tokens are the only real spend — weekly review is the
big prompt; lessons are cheap.

## Non-goals

- No real-money trading. Paper only, like every SGiQ bot.
- No multi-user, no sharing, no public deployment beyond Basic Auth.
- No hand-authored curriculum content.
- No brokerage referral/affiliate anything.
