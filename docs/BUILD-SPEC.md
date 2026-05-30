# Executive Function OS — v1 Build Spec ("EF-OS")

> **Single source of truth for the build.** Hand this to your AI coding tool (Cursor or Claude Code).
> Build in milestone order (Section 8). Do **one milestone per session**. Do not start the next milestone
> until the current one runs and is verified.

---

## 0. How to use this document

1. Read Sections 1–7 so you understand the whole shape.
2. When building, paste Sections 1–7 (context) **plus the one milestone you're working on** (Section 8) into Cursor/Claude Code.
3. Build that milestone only. Run it. Verify it against its checklist. Then move on.
4. Never tell the AI "build the whole app." It will produce a tangled mess. One milestone at a time.

---

## 1. What v1 IS (and is NOT)

**v1 = the daily executive-function loop. Single-user usable, web only, multi-user-ready underneath.**

**IN scope:** capture (brain dump), AI prioritization, morning plan, evening review with adaptive
re-planning, persistent memory, login/auth.

**OUT of scope — DO NOT BUILD in v1 (parking lot for v2+):** mobile / React Native, voice input,
calendar or Maps integrations, machine learning, burnout detection, coaching marketplace, learning
platform, gamification beyond a single simple streak counter.

If a feature is not in the IN list, it does not get built in v1. No exceptions.

---

## 2. Users & goal

Build for one user (the founder) first. Architecture must be multi-user-ready so it can open to others
later **without a rewrite**. This is why we use real auth + per-user data isolation from day one — the
founder is simply user #1.

---

## 3. Product principles (the spine — every feature obeys these)

1. Always answer the question "what do I do next?"
2. Adapt, never shame. A missed task is rescheduled, not flagged as failure. No guilt.
3. Reduce friction and decisions. Tasks are broken into the smallest possible next physical action.
4. The AI's tone is tough-love accountability: firm, direct, names avoidance — but never cruel, never
   shaming about the person's worth, and never acting as a therapist or doctor.

---

## 4. Tech stack (decided — do not deviate in v1)

- **Next.js (App Router) + TypeScript + Tailwind CSS** — one codebase for screens and backend API routes.
- **Supabase** — hosted Postgres database + authentication + Row Level Security (per-user data isolation).
- **Anthropic Claude API** — the reasoning layer (prioritization, plan, review). Server-side only.
- **Vercel** — hosting and deployment from a GitHub repo.

**Explicitly dropped for v1, with reasons:**
- FastAPI / Python — Next.js API routes cover the backend; one language, one deploy.
- React Native — web first.
- Vector database + LangGraph — unnecessary until there's a large history to search.
- Google Cloud — Vercel + Supabase is far less to operate.

---

## 5. Data model (Supabase / Postgres)

Every table has a `user_id` column. Row Level Security (RLS) policies restrict every row to its owner.

**`items`**
- `id` uuid (pk)
- `user_id` uuid (fk to auth user)
- `content` text — the raw thing the user typed
- `status` text enum: `inbox` | `active` | `done` | `parked`
- `importance` int 1–5, nullable
- `effort` text enum: `low` | `med` | `high`, nullable
- `energy` text enum: `low` | `med` | `high`, nullable
- `urgency` int 1–5, nullable
- `scheduled_for` date, nullable
- `created_at` timestamptz default now()
- `completed_at` timestamptz, nullable

**`daily_logs`**
- `id` uuid (pk)
- `user_id` uuid
- `log_date` date
- `type` text enum: `morning` | `evening`
- `energy_level` int 1–10, nullable
- `focus_item_id` uuid, nullable (fk to items)
- `payload` jsonb — the AI's plan or review output
- `created_at` timestamptz default now()

**`coach_state`** (one row per user — the persistent memory)
- `id` uuid (pk)
- `user_id` uuid UNIQUE
- `state` jsonb — `{ streaks, stuck_patterns, learning_plan, relationships, wins }`
- `updated_at` timestamptz default now()

---

## 6. API contracts (Next.js route handlers)

Rules for every route: it runs on the server, requires a valid Supabase session, and scopes every query
by the logged-in `user_id`. Returns JSON.

- `POST /api/items` — body `{ content: string }` → creates an `inbox` item. Returns the new item.
- `GET /api/items?status=` — returns the user's items (optionally filtered by status).
- `PATCH /api/items/[id]` — body `{ status?, importance?, effort?, energy?, urgency?, scheduled_for? }` → updates one item.
- `POST /api/plan/morning` — body `{ energy_level: number, looming?: string }`.
  Server loads open items + `coach_state`, calls Claude, returns the morning plan JSON (Section 7),
  saves a `daily_logs` row of type `morning`.
- `POST /api/plan/evening` — body `{ done_ids: string[], skipped_ids: string[], notes?: string }`.
  Server calls Claude, returns the evening review JSON (Section 7), saves a `daily_logs` row of type
  `evening`, and updates `coach_state`.

**Security (non-negotiable):** the Claude API key and the Supabase service-role key live ONLY in
server environment variables. They are never sent to the browser. `.env` is never committed to git.

---

## 7. The AI "brain"

When calling the Claude API, the app sends the system prompt below and asks Claude to return **only valid
JSON** (no prose, no markdown fences) matching the contracts. The app parses that JSON to render screens.

### 7a. System prompt (send as the `system` parameter)

```
You are the reasoning engine for an ADHD executive-function app. You act as a sharp, ADHD-aware
chief of staff. Tone: tough-love accountability — firm, direct, name avoidance and vague plans —
but never cruel, never shaming the person's worth, never acting as a therapist or doctor.

Hard rules:
- Break every task into the smallest possible next PHYSICAL action (e.g., "open the JSM admin page",
  not "learn JSM"). If an action feels heavy, split it smaller.
- Respect priority order when forced to choose: (1) focus/follow-through, (2) career mastery,
  (3) relationships, (4) health/lifestyle.
- Adapt, never punish. A skipped task is rescheduled, not flagged as failure.
- Time-box: every action gets a specific minute estimate.
- Respond with ONLY valid JSON matching the requested schema. No prose. No markdown fences.
```

### 7b. Morning plan — required JSON output

```json
{
  "focus_item_id": "uuid-of-the-single-most-important-task",
  "plan": [
    { "item_id": "uuid", "action": "specific tiny next action", "minutes": 25 }
  ],
  "non_work_move": { "item_id": "uuid-or-null", "action": "one small relationship/activity/learning rep" },
  "one_liner": "the marching order for today, one sentence"
}
```

### 7c. Evening review — required JSON output

```json
{
  "wins": ["short win", "short win"],
  "lesson": "one lesson from today",
  "tomorrow_focus_item_id": "uuid-or-null",
  "updated_state": {
    "streaks": { "checkins": 0, "movement": 0 },
    "stuck_patterns": ["recurring avoidance observed"],
    "learning_plan": { "JSM": "", "AI governance": "", "AI implementation": "", "exec comms": "" },
    "relationships": ["name/action"],
    "wins": ["rolling weekly wins"]
  }
}
```

The app saves `updated_state` straight into the `coach_state.state` column.

---

## 8. Build milestones (build in THIS order; verify each before the next)

**M0 — Skeleton live.** Create the Next.js app, run it locally, deploy to Vercel.
- Verify: the default page loads at `http://localhost:3000`, and (optional) at a public Vercel URL.

**M1 — Auth + capture.** Supabase email login. A capture box that saves an item to `items`, and a list
that shows the user's items. RLS turned on.
- Verify: sign in, add an item, refresh — it persists. A second test account cannot see the first's items.

**M2 — Morning plan.** A "Morning plan" screen: enter energy level, hit go, the app calls
`POST /api/plan/morning`, and renders the focus task + 2–4 tiny time-boxed actions.
- Verify: the response always includes exactly one focus task and at least one action with a minute estimate.

**M3 — Evening review + memory.** An "Evening review" screen: mark items done/skipped, the app calls
`POST /api/plan/evening`, adapts the plan, and writes `coach_state`.
- Verify: a skipped task reappears as a candidate tomorrow; the check-in streak increments by 1.

**M4 — Polish.** Tough-love copy, a single streak display, loading spinners, and friendly error states.
- Verify: nothing crashes when the AI is slow or returns bad data (see Section 9).

**Then stop.** Use it for a week before considering anything in the parking lot.

---

## 9. Failure modes & observability (build these in, not "later")

- **Claude is slow or down** → show a loading state; on failure, let the user plan manually; retry once.
- **Claude returns invalid JSON** → validate/parse defensively; on failure, show the items unprioritized
  rather than crashing.
- **Cost runaway** → set a `max_tokens` cap on every Claude call; log token usage.
- **Data-isolation bug** → RLS policy on every table; explicitly test with two accounts before opening up.
- **Logging** → structured `console` logs in each API route (route name, user id, outcome); read them in
  the Vercel dashboard logs.
- **Secrets** → all keys in environment variables; `.env` in `.gitignore`; never reference a key in any
  browser-side file.

---

## 10. Definition of done for v1

You use this app yourself, every morning and every evening, for **7 straight days**, without falling back
to the Claude Project coach. Only then consider opening it to other users.
```
