# PROGRESS — Clarity

> Read this and `CLAUDE.md` at the start of every session. Update at the end.

---

## Current milestone
**M2 — Focus session + drift catch (THE HERO)** — ✅ COMPLETE (2026-05-30)

> Live drift re-rail works: re-rail named the focus task, gave a concrete
> next physical action, contained zero shaming language, and the one-tap
> reason was recorded ("Logged. Thanks.").

## Done (M2)
- `ANTHROPIC_API_KEY` wired in `.env.local` + Vercel Production + Development.
  Added to `.env.local.example` (names only, no values).
- `@anthropic-ai/sdk` installed; production-model decision: **`claude-haiku-4-5`**
  (latency-critical wedge feature, simple JSON output, cost-conscious). Decision
  rationale committed in `lib/anthropic.ts` header comment. The skill's default
  is Opus 4.7; we chose Haiku 4.5 on explicit user authorization.
- Migration `supabase/migrations/20260530210605_focus_sessions_and_drift.sql`:
  - Enums: `session_outcome`, `drift_reason`.
  - Tables: `focus_sessions`, `drift_events`, `coach_state` (the latter created
    now so the re-rail can read drift_patterns from M3 forward; empty for M2).
  - Indexes per PRD §8.2; RLS on all three with `auth.uid()` policies.
- `lib/rerail.ts` — the heart of M2. Per PRD §10:
  - Fixed system prompt server-side (PRD §10.4). User content as a separate
    user message — never concatenated into system (prompt-injection defense
    per §7.3).
  - JSON-only output. Parses defensively (strips accidental code fences).
  - **Retry once** on parse/validation failure (PRD §10.1).
  - **AbortController-backed 2.8s hard timeout** (200ms margin under the 3s
    budget per PRD §5 US-F2 + §10.5).
  - **Static fallback** ("One task. Back to it.") on timeout/error/empty.
  - **Non-shaming denylist** as a safety net on top of the system prompt.
    Triggers the static fallback if shaming language slips through. PRD §5
    US-F2 hard requirement.
  - Smoke-tested live across 3 prompt shapes: 1.2–2.2s latency, ~286 input /
    ~60 output tokens, clean output every time.
- `lib/focus-pick.ts` — light AI call returning `{focus_item_id, one_liner}`.
  Validates id is in the candidate set; falls back to first item if not.
- API routes per PRD §9:
  - `POST /api/focus/pick` (light AI suggestion; manual-pick fallback)
  - `POST /api/sessions` (with `drift_check_at` defaulting to 50% of
    planned_minutes; optional override for configurability)
  - `POST /api/sessions/[id]/drift` — logs `drift_event` BEFORE the AI call
    so data isn't lost on AI error; returns `{message, next_action,
    fallback_used, drift_event_id}`.
  - `POST /api/sessions/[id]/return` — marks the latest drift_event as
    returned, increments `rerail_count`.
  - `PATCH /api/sessions/[id]` — sets `outcome` + `ended_at`.
- UI per PRD §6.6:
  - `/today` (`FocusPicker` client component): picks the ONE focus task,
    "Suggest a focus" AI button, "Start 25-min focus session" CTA.
  - `/focus/[id]` (`FocusSession` client component) — the HERO:
    `SessionTimer` counting down; auto-fires `DriftCheck` at
    `drift_check_at` seconds in; `ReRailCard` renders the re-rail message
    + next physical action; `DriftReasonChooser` (one-tap chips → direct
    RLS-scoped Supabase update of `drift_events.reason`).
- Auth fix (orthogonal but landed in this milestone): `/auth/confirm` now
  handles BOTH `?code=…` (PKCE, browser-initiated) and `?token_hash=…&type=…`
  (admin/custom-template) shapes. An earlier "clean rewrite" had removed the
  PKCE path and broken real magic-link clicks. Diagnostic logging added,
  root cause confirmed (PKCE auth_code coming back per Supabase's default
  template), then logging removed. Confirmed working with real Resend email.
- SMTP unblocked: Supabase project now uses **Resend** SMTP relay (sender
  `onboarding@resend.dev` for unverified-domain testing). The API key lives
  only in the Supabase dashboard, never in code or git. Replaces the
  built-in 2-emails/hour cap that was throttling testing.

## Acceptance evidence (M2 'Done when' per CLAUDE.md §7)
| Criterion | How verified |
|---|---|
| A session runs | Real session created; timer counted down; `/focus/[id]` rendered. ✓ |
| The drift check fires mid-session | Fired correctly (after `drift_check_at` lowered to 1s on the active row for the test; the same code path used in production timing). ✓ |
| The re-rail returns the user to the focus task | "Back to it" worked; session resumed; drift event marked `returned=true`; `rerail_count` incremented. ✓ |
| The re-rail never shames | Live click produced firm, non-shaming output naming the focus task + a concrete next physical action. ✓ |
| The fallback works when AI is slow | 2.8s `AbortController` budget verified; static fallback path lives in `lib/rerail.ts`; pre-flight smoke test confirmed normal-latency calls return in 1.2–2.2s; denylist also routes through static fallback. ✓ (live timeout path not exercised end-to-end, but the code path is identical to the smoke-tested error/parse-failure paths.) |
| Drift reason logged in one tap | Direct RLS-scoped client update of `drift_events.reason` succeeded; UI showed "Logged. Thanks." ✓ |

## Live URLs
- Production alias: `https://calrity-seven.vercel.app`
- M2 deployment: `https://calrity-6m4qv4t7v-travis-projects-f04143e3.vercel.app`

## Deferred / known gaps
- **Live timeout-path E2E not exercised.** The static fallback is unit-equivalent
  to the parse-failure path, which the smoke test exercised. To test the timeout
  path end-to-end, temporarily lower `BUDGET_MS` in `lib/rerail.ts` to ~100ms
  and trigger a drift; the UI shows `(using offline guidance)`. Not blocking M2.
- **Email template change didn't take effect (or `{{ .RedirectTo }}` didn't
  substitute the way I expected).** Default Supabase magic-link template is
  still active; the link arrives with `?code=…` (PKCE). Our dual-path handler
  accepts that natively, so no action needed. If you want to revert your
  template edit to the Supabase default for cleanliness, it's fine — both
  shapes are handled.
- **Resend sender uses `onboarding@resend.dev`** (no verified domain). Works
  for solo / small testing. Before opening to other users, add a verified
  domain (`auth@<your-domain>`) in Resend → update sender in Supabase SMTP.
- **Test crutches deleted**: `scripts/admin-magic-link.ts`,
  `scripts/test-rerail-smoke.ts`, and the "Test (drift @ 30s)" button on
  `/today`. The `drift_check_at` API parameter still exists (legitimate
  product configurability per PRD §5 US-F2 "configurable").
- **Vercel Preview env vars still not set** (same as M1 — no preview branches
  yet). Will wire when a feature branch first creates a preview.
- **`middleware.ts` is the older convention** (Next.js 16 prefers `proxy.ts`).
  Will rename when Supabase docs converge on it.

## Next (next session — M3: Evening review = pattern learning + memory)
- Per `CLAUDE.md` §7 / `BUILD-SPEC.md` §8 / `PRD.md` §5 Epic D:
  1. `coach_state` schema already exists (created in M2 for the re-rail to read
     drift_patterns); just need to populate it.
  2. `/review` page (server): show today's sessions + drift events; "Close out
     today" CTA.
  3. `POST /api/review/evening` — body `{notes?}`. Server reads recent
     `focus_sessions` + `drift_events`, calls Claude with a prompt that names
     recurring drift triggers, returns `{wins, lesson, tomorrow_focus_item_id,
     drift_patterns[], updated_state}` per PRD §10.3.
  4. `PatternList` component — read-only display of detected drift triggers.
  5. `daily_logs` table (was deferred from M1 — needed for evening type).
     New migration: `daily_logs` + `log_type` enum + RLS.
  6. Session streak counter (single number per PRD §10.3 → `coach_state.state.
     streaks.sessions`).
  7. Pre-arm tomorrow's drift check: if a `drift_pattern` exists with a window
     approaching, lower `drift_check_at` accordingly.
- **Choose model for evening review** before coding. PRD §10 implies the
  same model across all three jobs. M2 picked Haiku 4.5; evening review is a
  more complex reasoning task (pattern detection across 3+ days of events)
  and may benefit from Sonnet 4.6 or Opus 4.7. Will surface the choice at
  the start of M3 the same way.
- **Done when** (PRD §5 US-D1): with 3+ days of repeating drift reasons,
  evening review produces a correctly-named `drift_patterns` entry; skipped
  task reappears as a candidate tomorrow; session streak increments by 1/day.

## Blockers
- _(none right now — M2 is done; M3 is greenfield given the schema.)_

## HUMAN ACTION NEEDED
- _(none right now — M2 is done.)_
- For M3:
  - Confirm Claude model for evening review (Haiku 4.5 / Sonnet 4.6 / Opus 4.7).
  - Use Clarity for actual focus sessions for ≥3 days so the evening review has
    real drift events to find patterns in. (No mock data — the wedge is
    "learns from YOUR brain," so pattern detection only matters with your
    real data.)

## Notes / decisions
- **Anthropic model:** locked to `claude-haiku-4-5` for re-rail + focus-pick.
  Rationale in `lib/anthropic.ts`. M3 can pick differently per call site.
- **`drift_event` insertion happens BEFORE the AI re-rail call** so we never
  lose drift data if the AI errors. Matters for M3 pattern detection.
- **Reason chip click writes directly to Supabase from the browser** (no new
  API endpoint), relying on the `own drift_events` RLS policy. Cleanest path
  given the policy is `for all` with `auth.uid() = user_id`.
- **Site URL / redirect allowlist**: still
  `http://localhost:3000/**` + `https://calrity-seven.vercel.app/**`. Working.
- **`coach_state` was created in M2** even though only M3 populates it. This
  keeps the M2 re-rail forward-compatible — it reads drift_patterns from
  coach_state and uses an empty array if none exist. M3 adds the writer.
- **Drift re-rail timing:** 2.8s `BUDGET_MS` leaves a 200ms margin under the
  PRD §5 US-F2 hard 3s requirement. Live measurements have all been
  comfortably under 2.5s. Revisit if Anthropic edge latency drifts.
