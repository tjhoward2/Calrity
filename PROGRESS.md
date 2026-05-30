# PROGRESS — Clarity

> Read this and `CLAUDE.md` at the start of every session. Update at the end.

---

## Current milestone
**M0 — Skeleton** (in progress)

## Done
- _(nothing yet — first session)_

## Next (this session)
- Scaffold Next.js (App Router + TypeScript + Tailwind) into the repo root.
- Verify default page at `http://localhost:3000`.
- Init git in `~/Calrity`, connect to existing GitHub repo
  `https://github.com/tjhoward2/Calrity` as `origin`, push.
- Deploy to Vercel; verify the public URL loads.
- Stop. Do not start M1.

## Blockers
- _(none)_

## HUMAN ACTION NEEDED
- _(none right now — `gh` and `vercel` CLIs are already authenticated.
  Will ask if a login or secret is needed.)_

## Notes / decisions
- Stack locked per `CLAUDE.md` §3: Next.js App Router + TS + Tailwind, Supabase
  (M1+), Anthropic Claude API (M2+), Vercel.
- M0 explicitly excludes Supabase, Anthropic, `.env.local`, auth, and DB schema —
  those are M1+.
