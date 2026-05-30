# CLAUDE.md — Operating Manual for Clarity (read this every session)

You are the implementing engineer for **Clarity**, an ADHD focus tool. This file is your standing brief.
At the START of every session: read this file AND `PROGRESS.md`. At the END of every session: update
`PROGRESS.md` and commit. The human does not want to re-explain the project — that's what these files are for.

---

## 1. What we're building (and the ONE thing that matters)

Clarity's wedge: **catch the user the moment they drift during a focus block and re-rail them — without
shame — then learn what pulls them away.** Competitors plan the day (Motion) or organize it (Saner); none
intervene at the moment the day is lost. The drift loop is the hero. Everything else is secondary.

Full detail lives in `/docs`:
- `/docs/PRD.md` — the source of truth (data model, API, AI prompts, UX, acceptance criteria).
- `/docs/BUILD-SPEC.md` — the milestone build order.
- `/docs/ROADMAP.md` — everything that is explicitly OUT of v1. Do not build from this file.

If this file and `/docs/PRD.md` ever conflict, follow `/docs/PRD.md` and flag the conflict to the human.

---

## 2. Golden rules (do not break these)

1. **Build in milestone order (Section 7). ONE milestone per session.** Do not start the next milestone
   until the current one is verified against its "Done when" criteria and committed.
2. **Build ONLY what the current milestone requires.** No features from `/docs/ROADMAP.md`. No "while I'm
   here" additions. If you think something else is needed, ask the human first.
3. **Commit to git after every working step**, with clear messages. Push to GitHub when the milestone is done.
4. **Never commit secrets.** API keys and service keys live in `.env.local` (gitignored) and in Vercel/
   Supabase dashboards — never in code, never in git, never echoed into `PROGRESS.md`.
5. **Verify before moving on.** Run the app, run the relevant tests, confirm the "Done when" criteria.
6. **When you need the human, ask for ONE thing at a time, clearly**, and pause. The only things you should
   ever need from the human are: (a) completing a browser login, (b) a secret value to paste into
   `.env.local` or a dashboard, (c) a yes/no on something destructive. Everything else, do yourself.
7. **Keep `PROGRESS.md` current**: what's done, what's next, any blockers, any human action pending.

---

## 3. The stack (decided — do not deviate)

- **Next.js (App Router) + TypeScript + Tailwind CSS** — one codebase, frontend + backend API routes.
- **Supabase** — Postgres + magic-link auth + Row Level Security (per-user data isolation).
- **Anthropic Claude API** — the reasoning layer (focus-pick, drift re-rail, evening pattern review),
  called **server-side only**.
- **Vercel** — hosting + deploys from GitHub.
- Testing: Vitest (unit/integration) + Playwright (E2E). Lint + typecheck on every commit.

Do NOT add: a separate Python backend, React Native, a vector DB, LangGraph, or any third-party
integrations. Those are later tiers.

---

## 4. Infrastructure you set up (drive these yourself via CLIs)

You are expected to create and wire up the infrastructure, asking the human only to log in or paste secrets.

- **GitHub:** the repo already exists at **https://github.com/tjhoward2/Calrity**. Set it as the `origin`
  remote and push to it — do NOT create a new repo. If `gh` isn't installed or authenticated, install it
  and run `gh auth login`, then tell the human to complete the browser step.
- **Vercel:** link the project and deploy via the `vercel` CLI. If not authenticated, run `vercel login`
  and tell the human to complete the browser step. Set environment variables via `vercel env add` (ask the
  human for secret values) — never hardcode them.
- **Supabase:** the human creates the Supabase *project* in the dashboard (account action). You handle the
  schema. Prefer the `supabase` CLI for migrations; if CLI auth is friction, instead generate the SQL and
  give the human a single copy-paste block to run in the Supabase SQL Editor. Either way, keep versioned
  migration files in the repo under `/supabase/migrations`.
- **Secrets the app needs** (ask the human for the values, store in `.env.local` + Vercel env):
  `ANTHROPIC_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. Create a
  committed `.env.local.example` documenting the names (no values). Ensure `.env.local` is in `.gitignore`.

When you hit something only the human can do, write it to `PROGRESS.md` under "HUMAN ACTION NEEDED" and ask.

---

## 5. Security must-haves (these are not optional)

- **Row Level Security ON for every table**, with policies scoping rows to `auth.uid()`. Before declaring a
  milestone with data done, verify with two test accounts that account B cannot see account A's rows.
- **The Anthropic key and Supabase service-role key are server-only.** Never reference them in any client
  component or send them to the browser. The browser uses only the Supabase anon key + the user session.
- **User-typed content is untrusted.** The AI system prompt is fixed server-side; user content goes in a
  separate user message, never concatenated into the system prompt.
- The **drift re-rail must never use shaming/failure language** — this is a product safety requirement.
  Add a simple denylist check on re-rail output and a static fallback.

---

## 6. The AI calls (server-side)

- Use the current production Claude API model. **Verify the exact model ID and pricing in Anthropic's docs
  before coding — do not assume an older model name.** If unsure, ask the human to confirm the model ID.
- Instruct the model to return ONLY valid JSON matching the schemas in `/docs/PRD.md` (§10). Validate the
  JSON; on parse failure retry once; on second failure use the documented fallback. Cap `max_tokens`. The
  drift re-rail has a tight latency budget (<3 s) and a static fallback.

---

## 7. Milestone plan (build in this order; full criteria in `/docs/PRD.md` §5 and `/docs/BUILD-SPEC.md`)

- **M0 — Skeleton.** Scaffold the Next.js app in this repo (keep `CLAUDE.md`, `/docs`, `PROGRESS.md` at
  root). Init git if needed, connect to the existing GitHub repo
  (https://github.com/tjhoward2/Calrity) as `origin`, push, then deploy to Vercel.
  *Done when:* the default page loads locally AND at a public Vercel URL.
- **M1 — Auth + capture.** Supabase project linked; magic-link auth; `items` table + RLS; a capture box;
  an inbox list grouped by status; `POST /api/items`, `GET /api/items`, `PATCH /api/items/[id]`.
  *Done when:* sign in, add an item, refresh → it persists; a second account cannot see it.
- **M2 — Focus session + drift catch (THE HERO).** `focus_sessions` + `drift_events` tables; pick-focus on
  Today; `/focus` timer; mid-session drift check; re-rail (Claude, <3 s, non-shaming, static fallback);
  one-tap drift log; endpoints per `/docs/PRD.md` §9.
  *Done when:* a session runs, the drift check fires, the re-rail returns the user to the focus task, the
  re-rail never shames, and the fallback works when the AI is slow.
- **M3 — Evening review = pattern learning + memory.** `coach_state`; evening review reads sessions +
  drift events; names recurring drift triggers; persists patterns; pre-arms tomorrow's check; session streak.
  *Done when:* 3+ days of repeating drift reasons produce a correctly named pattern; skipped task reappears.
- **M4 — Polish + hardening.** Tough-love (non-shaming) copy, streak display, loading/error/empty states,
  accessibility pass (WCAG AA, keyboard, reduced-motion), observability logs, green E2E.
  *Done when:* the PRD §12 manual QA checklist passes.

After M4: STOP. Do not start roadmap items. The human uses it for 7 days first.

---

## 8. Definition of done for v1

The human runs a focus session with the drift check daily for 7 straight days, and by day 7 the app has
named at least one real recurring drift trigger. Only then consider anything from `/docs/ROADMAP.md`.

---

## 9. Session ritual (every time)

1. Read `CLAUDE.md` + `PROGRESS.md`.
2. State which milestone you're on and the plan for this session (briefly).
3. Build → verify → commit.
4. Update `PROGRESS.md` (done / next / blockers / HUMAN ACTION NEEDED).
5. If the milestone is complete, push and confirm the deploy, then stop and tell the human what's next.
