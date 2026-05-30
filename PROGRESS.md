# PROGRESS — Clarity

> Read this and `CLAUDE.md` at the start of every session. Update at the end.

---

## Current milestone
**M0 — Skeleton** — ✅ COMPLETE (2026-05-30)

## Done
- Scaffolded Next.js 16.2.6 (App Router) + React 19 + Tailwind v4 + TypeScript 5
  + ESLint 9 into `~/Calrity/` alongside `CLAUDE.md`, `docs/`, `PROGRESS.md`.
- Verified default page at `http://localhost:3000` (HTTP 200, "Create Next App"
  title, Turbopack ready in ~325ms).
- `git init -b main`, initial commit, connected to existing GitHub repo
  `https://github.com/tjhoward2/Calrity` as `origin`. Merged the GitHub-init
  root commit using `-s ours` (preserves history without force-push). Pushed.
- Created Vercel project `calrity` (lowercased to satisfy Vercel's name
  validation), linked the local directory, connected the GitHub repo so future
  pushes auto-deploy.
- Hit a 404-on-`/` issue caused by Vercel's framework preset being "Other"
  (auto-detection skipped because `vercel projects add` was used to pre-create
  the project). Fixed by committing `vercel.json` with `"framework": "nextjs"`.
- Disabled Vercel SSO deployment protection so the public URL is reachable
  (human-authorized; revisit before M1 if private preview deploys are desired).
- **Verified live public URL serves the Next.js default page (HTTP 200):**
  - Production alias: `https://calrity-seven.vercel.app`
  - Latest deployment: `https://calrity-d6i4ckruy-travis-projects-f04143e3.vercel.app`

## Next (next session — M1)
- Per `CLAUDE.md` §7 / `BUILD-SPEC.md` §8 / `PRD.md` §5 Epics A+B+E:
  1. Human creates the Supabase project in the dashboard (account action).
  2. Wire `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` into
     `.env.local` and `vercel env add` (human pastes values).
  3. Create `.env.local.example` (committed; documents names only).
  4. `items` table + RLS via versioned migration under `/supabase/migrations`.
  5. Magic-link auth flow (`/login`, session persistence).
  6. CaptureBar + Inbox list grouped by status.
  7. `POST /api/items`, `GET /api/items`, `PATCH /api/items/[id]`.
- **Done when:** US-A1, US-B1, US-B2, US-E1 acceptance pass — including the
  two-account RLS isolation test (account B never sees account A's rows).

## Blockers
- _(none for M0; M1 will need the human to create the Supabase project + paste
  the three Supabase env values.)_

## HUMAN ACTION NEEDED
- _(none right now — M0 is done.)_
- For M1, will need:
  - Create the Supabase project (name + region) in the Supabase dashboard.
  - Paste `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` so
    they can be written into `.env.local` and `vercel env add`.

## Notes / decisions
- Stack locked per `CLAUDE.md` §3: Next.js App Router + TS + Tailwind, Supabase
  (M1+), Anthropic Claude API (M2+), Vercel.
- Tailwind v4 generated — config lives in CSS via `@theme {}`, no
  `tailwind.config.ts` file (different from v3). PRD §6.4 design tokens will
  go into `app/globals.css` when M4 polish happens.
- `vercel.json` pins `"framework": "nextjs"`. Don't remove it — the project
  was created without auto-detection and would revert to "Other" / static
  serving from `/public/`.
- Vercel SSO protection is OFF for `.vercel.app` URLs. Can be re-enabled with
  `vercel project protection enable --sso` if private preview deploys become
  desirable (e.g., when M1 introduces real user data behind auth).
- Git history has 3 root-adjacent commits: GitHub's "Initial commit",
  scaffold commit, and an `-s ours` merge joining them. Clean linear history
  from this point forward.
- All M0 scope respected — no Supabase, no Anthropic, no `.env*` files, no
  auth, no DB schema. Those are M1+.
