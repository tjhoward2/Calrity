# PROGRESS — Clarity

> Read this and `CLAUDE.md` at the start of every session. Update at the end.

---

## Current milestone
**M1 — Auth + capture** — ✅ COMPLETE (2026-05-30)

## Done (M1)
- Supabase project `Clarity` (ref `aacbuvchbwwhraybrmxt`, region us-west-2)
  linked via Supabase CLI v2.98.2.
- **New-format API keys wired** — diverges from `CLAUDE.md` §4 naming (which
  predates the new key format). Convention now used:
  - `NEXT_PUBLIC_SUPABASE_URL` (browser + server)
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (`sb_publishable_…`, replaces
    legacy `anon`; browser-safe; RLS still applies)
  - `SUPABASE_SECRET_KEY` (`sb_secret_…`, replaces legacy `service_role`;
    server-only, no `NEXT_PUBLIC_` prefix; bypasses RLS)
  - All three set in Vercel Production + Development. Preview env not set
    yet (Vercel won't scope preview-env to `main` since that's the prod
    branch; will add when a feature branch first creates a preview).
  - `.env.local.example` committed (names only); `.env.local` gitignored
    (explicit `!.env.local.example` allow-rule added to `.gitignore`).
- Packages: `@supabase/ssr` + `@supabase/supabase-js`.
- Supabase client utilities (all in `lib/supabase/`):
  - `client.ts` — `createBrowserClient` for `'use client'` components.
  - `server.ts` — `createServerClient` w/ `next/headers` cookies adapter,
    for Server Components / route handlers / server actions.
  - `admin.ts` — `createClient` w/ secret key, `'server-only'` import as a
    compile-time guard against accidental client use. Bypasses RLS.
  - `middleware.ts` — session-refresh helper. Redirects signed-out users
    from page routes to `/login`; lets `/api/*` through so route handlers
    can return JSON 401 instead of HTML 302.
  - `middleware.ts` at repo root wires it to Next.js. Next.js 16 deprecates
    this filename in favor of `proxy.ts` (warning at build) — still works,
    will rename when Supabase docs catch up.
- Migration `supabase/migrations/20260530202457_init_items.sql`:
  - Enums: `item_status`, `effort_size`, `energy_level` (the three the
    items table references). M2/M3 enums and tables NOT created (strict
    scope).
  - `items` table per PRD §8.2 — full column set, with M2+ columns left
    nullable. Indexes on `(user_id, status)` and `(user_id, scheduled_for)`.
    `updated_at` trigger.
  - RLS enabled, `"own items"` policy: `for all using/with check
    (auth.uid() = user_id)`. Explicit GRANTs to `authenticated`.
  - Applied via `supabase db push`. Schema lives in the remote project.
- Routes:
  - `/` (server) — redirects to `/inbox` (middleware handles unauth).
  - `/login` (server) + server action `signIn` calling
    `signInWithOtp({ email, options.emailRedirectTo })`. Origin built
    from request headers so the same code works on localhost + prod.
  - `/auth/confirm` route handler — `exchangeCodeForSession`, redirects
    to `/inbox` on success, `/login?error=…` on failure.
  - `/inbox` (server) — protected via `getUser()`, fetches user's items
    server-side, renders `<CaptureBar>` + `<ItemList>` + `<SignOut>`.
  - `CaptureBar` (client) — autofocus, optimistic input clear + refocus
    after save, ignores empty submissions, error display.
  - `ItemList` (client) — grouped by status (inbox/active/done/parked),
    newest-first within each group, hover-revealed status actions
    (activate / done / park / reopen).
  - `SignOut` (client) — calls `supabase.auth.signOut()`, redirects to
    `/login`.
- API routes per PRD §9:
  - `POST /api/items` — content validation (1–2000 chars), 401 if unauth,
    201 + item on success.
  - `GET /api/items?status=` — optional status filter, validates enum, RLS
    scopes by user.
  - `PATCH /api/items/[id]` — field allowlist (status, importance, effort,
    energy, urgency, scheduled_for), per-field type validation, sets
    `completed_at` when status→done and clears it otherwise, 404 on RLS
    miss (so callers can't distinguish "not found" from "not yours").

## Acceptance evidence (M1 'Done when')
- **US-A1** Magic-link sign in works → manual browser test ✓.
- **Session persists** across refresh → manual browser test ✓.
- **Two-account isolation** — BOTH layers:
  - DB layer (PRD §12 critical): `scripts/rls-isolation-test.ts` —
    6/6 checks pass. Creates two real users via admin, exercises SELECT
    / UPDATE / DELETE attempts from account B against account A's row,
    confirms via admin readback that A's content survives B's tampering
    attempts (catches the silent-update RLS trap from supabase skill
    checklist).
  - UI layer (CLAUDE.md §7 + PRD §5 US-A1): manual browser test — sign
    out of A → sign in as B → B sees empty inbox → sign back in as A →
    A's data intact. ✓.
- **US-B1** capture saves under 1s, input clears + stays focused, empty
  submits ignored → manual browser test ✓.
- **US-B2** inbox grouped by status, newest-first within group → renders
  correctly ✓.
- **US-E1** done sets `completed_at`; reopen clears it; park supported.
  Implemented + verified via API. Manual UI walk-through done implicitly
  via two-account test (status changes worked).

## Live URLs
- Production alias: `https://calrity-seven.vercel.app`
- Latest deployment: `https://calrity-b2ey94ych-travis-projects-f04143e3.vercel.app`
- Verified prod surfaces: `/` 307 redirect, `/login` 200 + correct content,
  `/api/items` 401 JSON when unauth.

## Deferred / known gaps (deliberate)
- **Prod magic-link sign-in not spot-checked end-to-end.** Local sign-in
  works; prod surfaces respond correctly to unauth requests. The only
  prod-specific risk is whether Supabase's redirect-URL allowlist
  includes `https://calrity-seven.vercel.app/**`. User chose to defer
  spot-check. If a prod sign-in fails later, that allowlist is the first
  thing to check (dashboard → Auth → URL Configuration).
- **Vercel Preview env vars not set.** Vercel rejects scoping preview env
  to `main` (it's the prod branch). Will add when the first non-main
  branch is pushed.
- **`middleware.ts` is the older convention** (Next.js 16 prefers `proxy.ts`).
  Still works; rename later when Supabase docs converge on it.

## Next (next session — M2: focus session + drift catch, THE HERO)
- Per `CLAUDE.md` §7 / `BUILD-SPEC.md` §8 / `PRD.md` §5 Epics C+F+G:
  1. **Choose Anthropic Claude model ID at build time** — PRD §10.1 says
     "verify in Anthropic docs before coding". Don't hardcode an assumed
     name. Will ask the human to confirm or check.
  2. Migration: `focus_sessions` + `drift_events` tables + their enums
     (`session_outcome`, `drift_reason`), with RLS.
  3. `ANTHROPIC_API_KEY` — human to supply; goes in `.env.local` and
     Vercel env. Update `.env.local.example`.
  4. `/today` (pick the ONE focus task — light AI call OR manual pick).
  5. `/focus` (the HERO screen — session timer + mid-session drift check).
  6. `POST /api/focus/pick`, `POST /api/sessions`,
     `POST /api/sessions/[id]/drift` (Claude re-rail, <3s budget, static
     fallback, **non-shaming denylist**), `POST /api/sessions/[id]/return`,
     `PATCH /api/sessions/[id]`.
  7. `DriftCheck`, `ReRailCard`, `DriftReasonChooser` components.
- **Done when** US-C1, US-F1, US-F2, US-G1 pass — including: drift check
  fires mid-session, re-rail returns user to focus, re-rail NEVER uses
  shaming language (validate via denylist test), static fallback works
  when AI is slow.

## Blockers
- _(none for M1; M2 will need the human to provide
  `ANTHROPIC_API_KEY` and confirm the exact current Claude model ID.)_

## HUMAN ACTION NEEDED
- _(none right now — M1 is done.)_
- For M2:
  - Provide `ANTHROPIC_API_KEY` (Anthropic Console → API Keys).
  - Confirm/choose Claude model ID for the re-rail (PRD §10.1 explicitly
    says verify with docs at build time, do not assume).
  - If prod sign-in ever fails, check Supabase Auth → URL Configuration:
    Site URL + Redirect URLs must include `https://calrity-seven.vercel.app/**`.

## Notes / decisions
- **Env var naming diverges from CLAUDE.md §4** — that section was written
  pre-new-key-format. Treat `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` +
  `SUPABASE_SECRET_KEY` as the canonical names going forward. CLAUDE.md
  could be updated to reflect this; deferred so we don't touch the
  standing brief mid-milestone.
- Migration approach: applied via `supabase db push` against the linked
  remote project. Versioned files live under `supabase/migrations/` per
  `CLAUDE.md` §4 and §13.
- API contract: `PATCH /api/items/[id]` returns 404 (not 403) when RLS
  filters the row out. Intentional — callers should not be able to
  distinguish "this id doesn't exist" from "this id is someone else's".
- `'server-only'` import in `lib/supabase/admin.ts` is the compile-time
  tripwire that prevents accidentally importing the secret-key client
  from a client component. Cheap insurance.
- Two-account RLS test is repo-tracked under `scripts/`. Re-runnable
  (each run uses a timestamp-tagged email) + self-cleans up.
- `proxy.ts` vs `middleware.ts`: stuck with `middleware.ts` for now to
  match Supabase docs; will follow when they update.
