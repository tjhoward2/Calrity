# Clarity / EF-OS — Product Requirements & Technical Specification

**Version:** 1.1 (build-ready — re-centered on the wedge)
**Status:** v1 specified to implementation depth; v2/v3 at roadmap fidelity
**Owner:** Founder (product) + implementing team / AI coding tools
**Companion docs:** `ef-os-v1-build-spec.md` (milestone build order), `ef-os-roadmap-and-backlog.md` (full vision parking lot)

**The wedge (added in v1.1):** Clarity's one defensible job is to **catch the user the moment they drift
and re-rail them to the one thing that matters, then learn the pattern.** Competitors *plan* the day
(Motion) or *organize* it (Saner); none intervene in the moment the day is actually lost. The hero feature
is therefore the **focus session with a mid-session drift check + drift log**, not the morning plan.

> **How to read this:** Sections 1–4 are product. Sections 5–14 are the v1 engineering contract — build
> straight from them. Section 15 is the phased delivery plan. Sections 16–17 are v2/v3 at lower fidelity.
> Estimates in this document are rough order-of-magnitude and should be re-checked by the implementer.

---

## 1. Problem, Vision, Goals

### 1.1 Problem
Mainstream productivity tools assume the user already has strong executive function: they say "build your
system." People with ADHD struggle with execution, not intelligence — capture, prioritization, task
initiation, follow-through, working memory, time blindness, and overwhelm. Existing tools add cognitive
load instead of removing it.

### 1.2 Vision (north star)
An AI-powered personal operating system that acts as an **external executive-function layer** for ADHD.
That is the long-term destination. **It is not what v1 builds.** v1 earns the right to expand by nailing
one wedge first (§1.3).

### 1.3 The wedge & positioning (what v1 actually is)
**Wedge:** Clarity keeps the user *on the rails in real time* — it catches the drift the moment it happens
and pulls them back to the one task that matters, learning what pulls them away so it gets sharper.

**Positioning statement:** For the ADHD professional who loses whole days to distraction and is tired of
generic tools they must bend themselves around, Clarity is an executive-function tool that re-rails you in
the moment and adapts to how *your* brain works. Unlike Motion (plans your day) and Saner (organizes it),
Clarity is present at the moment the day is actually lost — and it doesn't shame you for it.

**The mechanic (general engine, personal via data):** start a focus block on one task → mid-block drift
check → if drifted, re-rail in a firm, non-shaming voice → one-tap log of *what* pulled you away → evening
review reads the drift log and names the user's recurring triggers → tomorrow's session is pre-armed.
The mechanic is identical for every user; the personalization is per-user pattern data. This is how
"built for my brain" becomes a scalable product rather than a tool for one person.

### 1.4 Product goals (v1)
1. The founder runs ≥ 1 focus session/day with the drift check for 7 consecutive days.
2. On drift, the re-rail returns the user to the focus task in < 10 seconds, with no shame language.
3. By day 7, the evening review surfaces at least one correctly-named recurring drift trigger.
4. Capturing a thought takes < 5 seconds and < 2 taps/clicks.
5. A missed task is silently rescheduled — never presented as failure.

### 1.4a The coach/learning layer — handled, not in the product (important)
The founder also wants a one-stop daily coach that teaches and guides career growth (JSM, AI governance,
AI implementation, exec comms) and life. **That need is real but it is a different job and a different
tool.** It is served *today* by the existing Claude Project coach (chat-with-memory is the right tool for
"know me and guide me"). It is NOT built into Clarity v1, because bolting a teaching coach onto a
drift-catching tool dilutes the wedge. If Clarity's wedge succeeds, coaching/learning enter as later tiers
of the same product (onboarding-as-coach in v2; learning layer in v3 — see §16–17). Earn it, don't bundle it.

### 1.5 Non-goals (v1)
Mobile native app, voice wake-word, calendar/wellness integrations, collaboration, gamification beyond a
single streak, ML/personalization models, marketplace, learning platform. (See Sections 16–17.)

---

## 2. Personas

### 2.1 Primary / beachhead — "The Drift-Prone Professional" (v1 target: n=1, the founder)
- ADHD adult, senior IC or leader; technical or technical-adjacent.
- Has tried Motion, Saner, Notion, Todoist, etc.; finds them generic or high-setup.
- **Core pain (the wedge target): loses whole days to distraction** — starts fine, gets sidetracked
  mid-task, surfaces hours later. Planning tools don't fix this; nothing is present at the moment of drift.
- Needs: be re-railed in the moment, without shame; near-zero setup; a tool that adapts to *their* brain.
- Beachhead is exactly one person (the founder) — prove the mechanic on n=1 before widening.

### 2.2 Secondary (v2+) — "The Less-Technical ADHD Adult"
Same pains, lower tolerance for configuration. Validates that the product is usable without technical skill.

### 2.3 Anti-persona
The "power organizer" who wants infinite customization and nested databases. Building for them reintroduces
the cognitive load we exist to remove. Politely not our user in v1.

---

## 3. Success Metrics & Instrumentation

| Metric | Definition | v1 target |
|---|---|---|
| Drift-catch usage | Days in last 7 with ≥ 1 focus session run | ≥ 5/7 |
| Re-rail effectiveness | Drift checks where user returns to focus task within 10s | ≥ 60% |
| Pattern detection | Recurring drift trigger correctly named by day 7 | ≥ 1 |
| Days not lost | Self-rated "stayed on track" days in last 7 | trending up |
| Capture speed | Median ms from "open capture" to "item saved" | < 5 s |
| Reschedule correctness | Skipped tasks that reappear next day | 100% |
| AI failure rate | % AI calls that error or return invalid JSON | < 2% |
| AI latency | p95 AI response time (plan/review/re-rail) | < 6 s; re-rail < 3 s |

Events to instrument (Section 13): `item_captured`, `session_started`, `drift_check_shown`,
`drift_reported`, `rerail_returned`, `session_completed`, `review_evening_submitted`, `pattern_detected`,
`item_completed`, `item_rescheduled`, `ai_call`, `ai_error`.

---

## 4. Scope & Phasing

- **v1 (this spec, Sections 5–15) — the drift wedge:** capture, pick the ONE focus task, **focus session
  with mid-session drift check + re-rail**, **drift log**, evening review that learns the user's drift
  patterns, persistent memory, auth. Web only. Single-user usable (n=1), multi-user-ready underneath.
  (A lightweight morning "pick your focus" replaces the heavy AI morning-plan as a supporting step, not the
  hero.)
- **v1.1–v1.2:** AI task decomposition, T-shirt sizing, energy-based ordering, streak/momentum display.
- **v2:** fast mobile capture (widget/share-sheet/voice-memo transcription), weekly sprint planning,
  routines, onboarding-as-coach, Google Calendar.
- **v3:** wellness integrations, collaboration, OS-level focus/distraction modes, full gamification, broad
  integrations, ADHD profiles, native mobile, **and the coaching/learning layer**.

---

## 5. v1 Functional Requirements (user stories + acceptance criteria)

Format: **US-#** story, then Gherkin acceptance criteria.

### Epic A — Authentication

**US-A1** — As a user, I can sign in with my email so my data is private to me.
- Given a valid email, when I request a login link, then I receive a magic-link email and clicking it
  signs me in and lands me on **Today**.
- Given I am signed in, when I close and reopen the app, then my session persists (no re-login for ≥ 7 days).
- Given two different accounts, when account B queries items, then account B never sees account A's rows.

### Epic B — Capture

**US-B1** — As a user, I can dump a thought into one box and have it saved instantly.
- Given I am on any primary screen, when I type text and submit, then the item is saved with status
  `inbox` and appears at the top of the inbox list within 1 second.
- Given an empty submission, when I submit, then nothing is saved and focus stays in the box.
- Given I submit, when saved, then the input clears and stays focused (rapid serial capture).

**US-B2** — As a user, I can see my captured items grouped by status.
- Given items exist, when I open Inbox, then I see items grouped `inbox / active / done / parked`,
  newest first within each group.

### Epic C — Pick the focus (supporting step, lightweight)

**US-C1** — As a user, I can choose the ONE task to work on now.
- Given open items, when I open Today, then I can mark one item as the focus (or the app suggests one via
  a single fast AI call returning just a `focus_item_id` + `one_liner`).
- Given no open items, when I open Today, then I'm prompted to capture something first.
- Given the AI suggestion errors, when it fails, then I can still pick a focus manually (no blocking).

### Epic F — Focus session + drift catch (THE HERO)

**US-F1** — As a user, I can start a timed focus block on my one task.
- Given a chosen focus task, when I start a session, then a `focus_sessions` row is created with
  `started_at`, the `item_id`, and a planned duration (default 25 min, user-adjustable), and a visible
  timer runs.
- Given a running session, when I end or complete it, then `ended_at` and `outcome`
  (`completed | abandoned | drifted_back`) are recorded.

**US-F2** — As a user, mid-session the app checks whether I've drifted and re-rails me.
- Given a running session, when a drift-check interval elapses (default once at ~50% of planned duration;
  configurable), then the app shows a single low-friction prompt: "Still on **[focus task]**?" with
  `Yes, on it` / `No, I drifted`.
- Given I tap `No, I drifted`, when the re-rail triggers, then the app shows a firm, non-shaming re-rail
  message naming the focus task and the immediate next physical action, and offers `Back to it` /
  `Pick a different focus`.
- Given I tap `Back to it`, when I return, then the session continues and a `rerail_returned` event +
  timestamp are logged.
- Given the re-rail AI call is slow/unavailable, when it fails, then a static fallback re-rail message is
  shown (e.g., "One task. Back to: [focus task]."), never a crash, within 3 s.
- Non-shaming requirement: re-rail copy never uses failure/guilt language; this is a hard acceptance
  criterion, not a stylistic preference.

### Epic G — Drift log

**US-G1** — As a user, when I drift I can log what pulled me away in one tap.
- Given I reported a drift, when re-railing, then I'm offered a one-tap reason chooser (e.g., a tab/site,
  a person/message, a thought, other) writing a `drift_events` row `{session_id, reason, note?, at}`.
- Given I skip logging, when I continue, then the drift is still counted (reason `unspecified`).
- The chooser must add no meaningful friction (≤ 1 tap to dismiss).

### Epic D — Evening review = pattern learning + memory

**US-D1** — As a user, each evening the system shows what happened and names *my* drift patterns.
- Given today's sessions + drift_events, when I open the review and submit, then the AI returns `wins`,
  one `lesson`, `tomorrow_focus_item_id`, **`drift_patterns` (named recurring triggers across recent
  days)**, and `updated_state`; a `daily_logs` row type `evening` is written; `coach_state.state` is
  updated to store detected patterns.
- Given ≥ 3 days of drift_events with a repeating reason, when the review runs, then at least one
  `drift_patterns` entry names that trigger (e.g., "afternoons → Slack").
- Given a task was skipped, when tomorrow's focus is chosen, then the skipped task is a candidate again
  (rescheduled, not failed).
- Given detected patterns exist, when tomorrow's first session starts, then the app pre-arms the drift
  check using them (e.g., earlier check if the trigger window is approaching).

### Epic E — Item lifecycle

**US-E1** — As a user, I can change an item's status and key attributes.
- Given an item, when I mark it done, then `status=done` and `completed_at` is set.
- Given an item, when I park it, then `status=parked` and it is excluded from planning until reactivated.

---

## 6. UX / UI Specification

### 6.1 Design principles (ADHD-first)
1. **One decision per screen.** Never present two competing primary actions.
2. **Always answer "what's next?"** The focus task is the largest element on Today.
3. **Calm, low-clutter, low-stimulation.** Generous whitespace, muted palette, no dense tables in v1.
4. **No guilt UI.** Skipped/incomplete states use neutral language and color, never red/alarm.
5. **Reduced motion by default.** Honor `prefers-reduced-motion`; animations subtle and optional.
6. **Forgiving input.** Single capture box, no required fields, no setup wizard in v1.

### 6.2 Information architecture (sitemap)
```
/login                  (unauthenticated)
/today                  (default after login) — pick the ONE focus task + start a session
/focus                  the focus session: timer + mid-session drift check + re-rail (HERO screen)
/inbox                  capture box + grouped item lists
/review                 evening review = what happened + your drift patterns
/settings               account, tone, session/drift-check defaults, sign out
```
Persistent bottom nav (mobile-width) / left rail (desktop): Today · Inbox · Review · Settings.
A floating capture (+) button is present on Today and Inbox. The focus session can run as a full-screen,
low-stimulation mode.

### 6.3 Component inventory
- `AppShell` (nav rail/bottom bar, content area)
- `CaptureBar` (always-available text input + submit; optimistic insert)
- `ItemCard` (content, status chip, size/energy chips when present, quick actions)
- `ItemList` (grouped, virtualized if > 100)
- `FocusCard` (the single most-important task, prominent)
- `SessionTimer` (full-screen-capable countdown for the focus block)
- `DriftCheck` (mid-session prompt: "Still on [task]?" → Yes / No, low-friction)
- `ReRailCard` (firm, non-shaming re-rail: focus task + next physical action + "Back to it")
- `DriftReasonChooser` (one-tap reason chips: tab/site · person · thought · other)
- `PatternList` (read-only display of detected drift triggers, evening)
- `ActionList` (today's 2–4 time-boxed actions with checkboxes + minute badges)
- `EnergySlider` (1–10, optional input)
- `PlanButton` / `ReviewButton` / `StartSessionButton` (primary CTA per screen, loading + error states)
- `Toast` (non-blocking success/error)
- `EmptyState` (encouraging, action-oriented copy)
- `Spinner` / `Skeleton`

### 6.4 Design tokens
- **Color:** background `#FAFAF8` (warm off-white); surface `#FFFFFF`; text `#1F2329`; muted text
  `#5B6470`; primary `#3B6EA5` (calm blue); success `#3F8F6B`; neutral-skip `#8A8F98` (NOT red);
  focus ring `#3B6EA5` at 2px. All pairings meet WCAG AA (≥ 4.5:1 for body text).
- **Type:** system UI stack; base 16px; scale 14 / 16 / 20 / 28 / 36; line-height 1.5. Offer an optional
  dyslexia-friendly font toggle in v1.1.
- **Spacing:** 4px base; 8 / 12 / 16 / 24 / 32 / 48.
- **Radius:** 12px cards, 8px inputs. **Shadow:** single soft elevation level.

### 6.5 Accessibility (required in v1)
- WCAG 2.1 AA. Full keyboard operability; visible focus rings; logical tab order.
- All interactive elements labeled; ARIA where needed; live region for toast/plan results.
- `prefers-reduced-motion` respected. Min target size 44×44px. No color-only status (chip + label).

### 6.6 Wireframes (v1)

**/login**
```
┌─────────────────────────────────────┐
│                                      │
│            Clarity                   │
│   Your external brain for ADHD       │
│                                      │
│   ┌──────────────────────────────┐  │
│   │ email@example.com            │  │
│   └──────────────────────────────┘  │
│   ┌──────────────────────────────┐  │
│   │     Email me a sign-in link  │  │ ← primary
│   └──────────────────────────────┘  │
│                                      │
│   (after submit) "Check your email." │
└─────────────────────────────────────┘
```

**/today** (pick the ONE thing, then start a session)
```
┌──────────────────────────────────────────┐
│  Today            energy: ●●●●●○○○○○ (5)   │
│ ─────────────────────────────────────────│
│  ┌──────────────────────────────────────┐ │
│  │ ▶ FOCUS: Open the JSM admin console  │ │ ← FocusCard (largest)
│  └──────────────────────────────────────┘ │
│        [  Start 25-min focus session  ]    │ ← primary CTA → /focus
│                                            │
│  Other open items (tap to make focus):     │
│   • Draft access-request form              │
│   • Reply to Mike re: ticket #482          │
│                                       (+)  │
└──────────────────────────────────────────┘
```

**/focus** (THE HERO — timer running)
```
┌──────────────────────────────────────────┐
│                 24:11                      │ ← SessionTimer (large, calm)
│            Open the JSM admin console      │
│                                            │
│              (low-stimulation mode)        │
│                                  [ End ]   │
└──────────────────────────────────────────┘
```

**/focus — drift check fires mid-session**
```
┌──────────────────────────────────────────┐
│  Quick check:                              │
│  Still on "Open the JSM admin console"?    │
│                                            │
│      [  Yes, on it  ]   [  No, I drifted ] │
└──────────────────────────────────────────┘
```

**/focus — re-rail + one-tap drift log (after "No, I drifted")**
```
┌──────────────────────────────────────────┐
│  No judgment. One task.                    │ ← non-shaming, hard requirement
│  Back to: Open the JSM admin console       │
│  Next move: click the Admin tab. That's it.│
│                                            │
│      [  Back to it  ]  [ Different focus ] │
│ ─────────────────────────────────────────│
│  What pulled you away? (1 tap)             │
│   [ a tab ] [ a person ] [ a thought ] [ … ]│ ← DriftReasonChooser
└──────────────────────────────────────────┘
```

**/inbox**
```
┌──────────────────────────────────────────┐
│  ┌──────────────────────────────────────┐ │
│  │ Dump a thought…                  [↵] │ │ ← CaptureBar (autofocus)
│  └──────────────────────────────────────┘ │
│  INBOX                                     │
│   • call the vet                  · · ·    │
│   • renew passport                · · ·    │
│  ACTIVE                                    │
│   • JSM request types mapping     · · ·    │
│  DONE (today)                              │
│   ✓ reply to Mike                          │
└──────────────────────────────────────────┘
```

**/review (evening)**
```
┌──────────────────────────────────────────┐
│  Evening review                            │
│  Sessions today:                           │
│   ✓ Open JSM console      (completed)       │
│   ↻ Draft access form     (drifted back)    │
│  Anything to note? ┌────────────────────┐  │
│                    │                    │  │
│                    └────────────────────┘  │
│            [  Close out today  ]           │
│ ── after submit ──                         │
│  Wins: 1 completed session · re-railed once │
│  Your pattern: afternoons → Slack (3 days)  │ ← PatternList (the payoff)
│  Tomorrow's focus: Draft access form        │
│  🔥 session streak: 4 days                  │
└──────────────────────────────────────────┘
```

---

## 7. System Architecture

### 7.1 Components
- **Client (Next.js App Router, React, TS, Tailwind):** screens + client state.
- **Server (Next.js Route Handlers):** all data + AI access; holds secrets; enforces auth.
- **Supabase:** Postgres (data), Auth (magic link), Row Level Security (isolation), automated backups.
- **Anthropic Claude API:** reasoning (plan, review, later decomposition). Server-side only.
- **Vercel:** hosting, preview deploys, logs, env var management.

### 7.2 Data flow (drift re-rail, the hero sequence)
```
Browser (mid-session) → POST /api/sessions/{id}/drift {reason}
  Server: verify Supabase session → get user_id → confirm session belongs to user
  Server → Supabase: INSERT drift_events; load focus item + coach_state.drift_patterns
  Server: build prompt → Claude API (system + focus task + patterns, JSON-only, < 3 s budget)
  Server: validate JSON + non-shaming denylist → on timeout/fail: static fallback {fallback_used:true}
  Server → Browser: 200 {message, next_action, fallback_used}
Browser: render ReRailCard + DriftReasonChooser
  → user taps "Back to it" → POST /api/sessions/{id}/return (rerail_count++, drift_events.returned=true)
```

### 7.3 Trust boundaries & secrets
- Browser is untrusted. It never holds the Claude key or Supabase service-role key.
- Client uses the Supabase **anon** key + the user's session JWT; RLS is the backstop.
- Server route handlers use the **service role** only where necessary, and always re-scope by `user_id`.
- User-entered text is sent into AI prompts → treat as untrusted; never let item content alter system
  instructions (the system prompt is fixed server-side; user content is a separate message).

---

## 8. Data Model (Postgres / Supabase)

### 8.1 Enums
```sql
create type item_status as enum ('inbox','active','done','parked');
create type effort_size as enum ('xs','s','m','l','xl');     -- v1.1 sizing; nullable in v1
create type energy_level as enum ('low','med','high');
create type log_type as enum ('morning','evening');
create type session_outcome as enum ('completed','abandoned','drifted_back');
create type drift_reason as enum ('tab_site','person_message','thought','other','unspecified');
```

### 8.2 Tables (DDL)
```sql
create table items (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  content       text not null check (char_length(content) between 1 and 2000),
  status        item_status not null default 'inbox',
  importance    int check (importance between 1 and 5),
  effort        effort_size,
  energy        energy_level,
  urgency       int check (urgency between 1 and 5),
  parent_id     uuid references items(id) on delete cascade,   -- for v1.1 decomposition
  scheduled_for date,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  completed_at  timestamptz
);
create index items_user_status_idx on items(user_id, status);
create index items_user_sched_idx  on items(user_id, scheduled_for);

create table daily_logs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  log_date      date not null,
  type          log_type not null,
  energy_level  int check (energy_level between 1 and 10),
  focus_item_id uuid references items(id) on delete set null,
  payload       jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);
create index daily_logs_user_date_idx on daily_logs(user_id, log_date);

create table coach_state (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null unique references auth.users(id) on delete cascade,
  state      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table focus_sessions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  item_id          uuid references items(id) on delete set null,
  planned_minutes  int not null default 25 check (planned_minutes between 5 and 120),
  drift_check_at   int,                       -- seconds into session when the check should fire
  started_at       timestamptz not null default now(),
  ended_at         timestamptz,
  outcome          session_outcome,
  rerail_count     int not null default 0
);
create index focus_sessions_user_started_idx on focus_sessions(user_id, started_at);

create table drift_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  session_id  uuid not null references focus_sessions(id) on delete cascade,
  reason      drift_reason not null default 'unspecified',
  note        text check (note is null or char_length(note) <= 280),
  returned    boolean not null default false,   -- did the re-rail bring them back?
  at          timestamptz not null default now()
);
create index drift_events_user_at_idx on drift_events(user_id, at);
```

### 8.3 Row Level Security (mandatory — enable on every table)
```sql
alter table items          enable row level security;
alter table daily_logs     enable row level security;
alter table coach_state    enable row level security;
alter table focus_sessions enable row level security;
alter table drift_events   enable row level security;

create policy "own items"  on items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own logs"   on daily_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own state"  on coach_state
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own sessions" on focus_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own drift"   on drift_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

### 8.4 `coach_state.state` JSON shape
```json
{
  "streaks": { "sessions": 0, "checkins": 0 },
  "drift_patterns": [ { "trigger": "afternoons → Slack", "count": 3, "last_seen": "2026-05-29" } ],
  "stuck_patterns": [],
  "relationships": [],
  "wins": []
}
```

---

## 9. API Specification (v1)

Conventions: JSON in/out; auth via Supabase session (cookie/JWT) on every route; all queries scoped by
`auth.uid()`. Error envelope: `{ "error": { "code": string, "message": string } }`.
Status codes: 200 ok, 201 created, 400 validation, 401 unauthenticated, 404 not found, 429 rate-limited,
500 server, 503 AI unavailable (after retry).

| Method | Path | Body | Success | Notes |
|---|---|---|---|---|
| POST | `/api/items` | `{content}` | 201 `{item}` | status defaults `inbox` |
| GET | `/api/items` | – (query `?status=`) | 200 `{items[]}` | scoped to user |
| PATCH | `/api/items/[id]` | `{status?,importance?,effort?,energy?,urgency?,scheduled_for?}` | 200 `{item}` | 404 if not owner |
| POST | `/api/focus/pick` | `{energy_level?}` | 200 `{focus_item_id, one_liner}` | light AI call; manual fallback |
| POST | `/api/sessions` | `{item_id, planned_minutes?}` | 201 `{session}` | creates session, sets `drift_check_at` |
| POST | `/api/sessions/[id]/drift` | `{reason?, note?}` | 200 `{rerail}` | logs `drift_events`, returns re-rail JSON (§10.2b) |
| POST | `/api/sessions/[id]/return` | – | 200 `{session}` | marks re-rail returned; `rerail_count++` |
| PATCH | `/api/sessions/[id]` | `{outcome}` | 200 `{session}` | sets `ended_at`, `outcome` |
| POST | `/api/review/evening` | `{notes?}` | 200 evening JSON (§10.3) | reads sessions+drift, writes log, updates `coach_state` |

Validation: reject unknown fields; clamp `planned_minutes` 5–120; cap `note` ≤ 280 and `notes` ≤ 1000.
Rate limit AI routes per user (e.g., 60/hour to allow several sessions) to bound cost. The drift re-rail
route has a tight latency budget (< 3 s) and a static fallback.

---

## 10. AI Layer

### 10.1 Model & call config
- Use the current production Claude API model. **Verify the exact model ID, context limits, and pricing in
  Anthropic's docs before coding** — do not hardcode an assumed model name. (I'm not certain of the latest
  identifier as of build time.)
- `temperature`: 0.3 (consistent planning). `max_tokens`: cap (e.g., 1200) to bound latency/cost.
- System prompt is fixed server-side (§10.4). User data is passed as a separate user message — never
  concatenated into the system prompt — to limit prompt-injection from item content.
- Response handling: instruct JSON-only; parse; validate against schema; **retry once** on parse/validation
  failure; on second failure return the documented fallback (open items unprioritized).

### 10.2 Focus-pick output schema (light call for `/api/focus/pick`)
```json
{ "focus_item_id": "uuid", "one_liner": "string" }
```
Constraint: `focus_item_id` ∈ provided open items. On failure, client lets the user pick manually.

### 10.2b Drift re-rail output schema (`/api/sessions/[id]/drift`)
```json
{
  "message": "firm, non-shaming line that names the focus task",
  "next_action": "the smallest possible next physical action",
  "fallback_used": false
}
```
Constraints: no failure/guilt language (validated against a denylist of shaming phrases as a safety net);
latency budget < 3 s; on timeout return a static `message`/`next_action` with `fallback_used: true`.

### 10.3 Evening review output schema
```json
{
  "wins": ["string"],
  "lesson": "string",
  "tomorrow_focus_item_id": "uuid|null",
  "drift_patterns": [ { "trigger": "string", "count": 0, "last_seen": "YYYY-MM-DD" } ],
  "updated_state": { "...": "matches coach_state.state shape (§8.4)" }
}
```
Input to this call includes recent `focus_sessions` + `drift_events` so the model can name repeating
triggers. `drift_patterns` is written into `coach_state.state.drift_patterns`.

### 10.4 System prompt (server-side, fixed)
```
You are the reasoning engine for an ADHD focus tool. You do three jobs: (1) pick the single most important
task, (2) re-rail the user the instant they drift, and (3) at day's end, name their recurring drift
triggers. Tone: firm, direct, tough-love — but NEVER cruel, NEVER shaming the person's worth, NEVER acting
as a therapist or doctor.

Rules:
- Re-rail: name the focus task and the smallest possible next PHYSICAL action; be brief; zero guilt or
  failure language. A drift is normal, not a failure.
- Pattern-naming: only assert a recurring trigger when the drift events actually support it; do not invent.
- Break tasks into the smallest possible next physical action; if heavy, split smaller.
- Respond with ONLY valid JSON matching the requested schema. No prose. No markdown fences.
```

### 10.5 Cost & latency controls
Cap `max_tokens`; one retry max; per-user hourly rate limit; log `input_tokens`/`output_tokens` per call
for cost tracking; show optimistic UI + skeleton during the call.

---

## 11. Non-Functional Requirements

- **Security:** RLS on all tables; secrets in env vars only; `.env` gitignored; OWASP basics (input
  validation, no SQL string-building — use the Supabase client/parameterized queries); HTTPS only;
  secure, httpOnly session cookies; CSRF protection on mutating routes.
- **Privacy:** store only what's needed; user can delete their account → cascade deletes all rows
  (FK `on delete cascade`). No third-party analytics that export task content. Health data (v3) is a
  separate, explicit consent + heightened handling — out of v1 scope.
- **Performance budgets:** first contentful paint < 2 s on broadband; capture save < 1 s; AI routes p95
  < 6 s; client bundle lean (no heavy UI libs in v1).
- **Reliability:** target 99% monthly availability v1 (single founder use); graceful degradation when AI
  is down (manual planning still works).
- **Observability:** structured server logs `{route, user_id, status, latency_ms, tokens}`; client error
  boundary; readable in Vercel logs.
- **Accessibility:** WCAG 2.1 AA (Section 6.5) — treated as a requirement, not a nice-to-have.

---

## 12. Testing Strategy

- **Unit:** validation/parsing helpers; AI-JSON schema validator (feed malformed payloads → expect
  fallback path); coach_state streak incrementer.
- **Integration (API):** each route — auth required (401 when signed out); ownership (404/empty for other
  users' rows); happy path; bad input (400).
- **RLS tests (critical):** with two seeded users, assert user B cannot read/update/delete user A's items,
  logs, or state — at the database layer, not just the API.
- **AI contract tests:** mock Claude to return (a) valid JSON, (b) malformed JSON, (c) timeout → assert
  retry then fallback; never crash.
- **Re-rail safety tests:** assert the re-rail output never contains shaming/failure language (denylist),
  and that the < 3 s timeout triggers the static fallback with `fallback_used: true`.
- **Pattern-learning test:** seed 3+ days of drift_events with one repeating reason → assert the evening
  review names that trigger and writes it to `coach_state.drift_patterns`.
- **E2E (Playwright):** sign in → capture → pick focus → start session → drift check → re-rail → back to it
  → end session → evening review shows the pattern → reopen → state persisted.
- **Manual QA checklist:** keyboard-only pass; reduced-motion pass; empty-state pass; AI-down pass.
- **Definition of done per milestone:** see Section 15 acceptance lines + this strategy.

---

## 13. DevOps, Environments, Analytics

- **Environments:** `local` (dev), `preview` (Vercel per-PR), `production`. Separate Supabase projects (or
  schemas) for non-prod vs prod; never test against prod data.
- **Secrets:** `ANTHROPIC_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` —
  set in Vercel + local `.env.local` (gitignored). Service role used only in server routes.
- **CI/CD:** on push → lint + typecheck + unit/integration tests must pass → Vercel preview deploy; merge
  to main → production deploy. Block merge on red.
- **Migrations:** versioned SQL migrations in-repo (Supabase migrations); never hand-edit prod schema.
- **Backups:** rely on Supabase automated backups; verify restore once before opening to other users.
- **Rollback:** Vercel instant rollback to prior deployment; migrations written to be forward-only and
  additive where possible (safe rollout).
- **Analytics:** lightweight, privacy-respecting event log (can be a `events` table or a privacy-friendly
  analytics tool) capturing the Section 3 events — **without** storing task content in third-party tools.

---

## 14. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Scope creep (build everything) | High | Fatal | Phasing in Section 4; v1 definition of done gate |
| Founder builds docs, not product | High | Fatal | Milestone M0 first; one milestone per session |
| AI returns bad/invalid output | Med | Med | Schema validation + retry + manual fallback |
| Data leak across users | Low | Severe | RLS on all tables + explicit two-account tests |
| AI cost runaway | Med | Med | max_tokens cap, per-user rate limit, token logging |
| AI latency feels slow | Med | Med | Optimistic UI, skeletons, p95 budget, one-retry max |
| Secrets leaked to client | Low | Severe | Secrets server-only; lint rule/checklist; review |
| Voice/wellness rabbit holes | Med | High | Explicitly Tier 3 (roadmap doc) |

---

## 15. Delivery Plan (v1) — milestones, tasks, rough estimates

> Estimates are rough and assume a solo builder using AI coding tools; verify against your own pace.

**M0 — Skeleton (≈0.5 day).** Create Next.js app, run locally, deploy to Vercel.
- Done when: public URL loads the default page.

**M1 — Auth + capture (≈2–3 days).** Supabase project; magic-link auth; `items` table + RLS; CaptureBar;
Inbox list grouped by status; `POST /api/items`, `GET /api/items`, `PATCH /api/items/[id]`.
- Done when: US-A1, US-B1, US-B2, US-E1 acceptance criteria pass, including the two-account isolation test.

**M2 — Focus session + drift catch (THE HERO) (≈3–4 days).** `focus_sessions` + `drift_events` tables;
Today (pick focus) + `/focus` (timer, `SessionTimer`); `POST /api/focus/pick`, `POST /api/sessions`,
`POST /api/sessions/[id]/drift` (Claude re-rail with < 3 s budget + static fallback + non-shaming
validation), `POST /api/sessions/[id]/return`, `PATCH /api/sessions/[id]`; `DriftCheck`, `ReRailCard`,
`DriftReasonChooser`.
- Done when: US-C1, US-F1, US-F2, US-G1 pass — including: drift check fires mid-session; re-rail returns
  user to focus; re-rail never uses shaming language; static fallback path works when AI is slow.

**M3 — Evening review = pattern learning + memory (≈2–3 days).** `coach_state`; `POST /api/review/evening`
reading sessions + drift_events; `PatternList`; pattern persistence; pre-arm tomorrow's drift check from
detected patterns; session streak.
- Done when: US-D1 passes — with ≥ 3 days of repeating drift reasons, a correct `drift_patterns` entry is
  produced; skipped task reappears; streak +1/day.

**M4 — Polish + hardening (≈2 days).** Tough-love copy, single streak display, loading/error/empty states,
accessibility pass, observability logs, E2E test green.
- Done when: full Section 12 manual QA checklist passes; 7-day self-use begins.

**Total rough v1: ~2 weeks of focused solo effort** (highly variable; not a commitment).

---

## 16. v2 (roadmap fidelity)

- **AI task decomposition (promote to first v1.1 item):** new endpoint `POST /api/items/[id]/decompose`
  → Claude returns ordered subtasks → insert as child `items` (parent_id). Highest-value next feature.
- **T-shirt sizing + energy ordering:** AI fills `effort`/`energy`; Today orders by energy match.
- **Fast mobile capture:** PWA install + share-target; one-tap voice memo using platform speech-to-text
  (NOT a custom wake word).
- **Weekly sprint planning:** goals across work/personal/health/financial/relationship/learning → weekly
  plan; new `sprints`/`goals` tables.
- **Routines:** templated recurring task sets; `routines` table + scheduler.
- **Onboarding-as-coach:** conversational setup writing initial `coach_state`.
- **Google Calendar (read first, then write):** OAuth; time-blocking; conflict detection.

## 17. v3 (roadmap fidelity)

Wellness device integrations (Apple Health/Oura/Whoop/Garmin → energy signal, explicit consent + sensitive
data handling); collaboration/shared projects; OS-level focus/distraction modes (incl. the "Hyper Focus
Mode" concept) — note OS gatekeeping makes always-on voice a major, possibly-fundraised effort; full
gamification; broad integrations (Slack/Notion/Jira/Todoist/Asana/Zapier/Make/M365/open API); custom ADHD
profiles; native mobile (React Native); **and the coaching/learning layer** (career + life guidance:
JSM, AI governance, AI implementation, exec comms) — until then this need is met by the separate Claude
Project coach, not the product.

---

## 18. Open Questions / Decision Log

**Decided:** Next.js+TS+Tailwind; Supabase (DB+auth+RLS); Claude API server-side; Vercel; web-first;
multi-user-ready from day one; **v1 hero = focus session + drift catch + drift log + pattern learning (the
wedge)**, not the morning plan; **career-coaching/learning is served by the separate Claude Project, not
built into the product until later tiers.**

**Open (resolve before/at the relevant milestone):**
1. Exact Claude model ID + pricing tier (verify in Anthropic docs at build time).
2. Product name: "Clarity" vs "EF-OS" vs other — defer until after v1 self-use.
3. Decomposition in v1 vs v1.1 — recommended v1.1; revisit if the loop feels incomplete without it.
4. Analytics implementation (own `events` table vs privacy-friendly tool) — decide at M4.
5. Multi-user opening criteria — only after the 7-day self-use bar (Section 1.4) is met.
```
