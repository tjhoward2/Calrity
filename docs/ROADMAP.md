# EF-OS / Clarity — Roadmap & Backlog ("the Parking Lot")

> Purpose: absorb the full vision from both vision docs so **nothing is lost**, while keeping the
> v1 build small enough to actually ship. Build order is top-down. Do not pull a lower tier forward
> until the tier above it is shipped and used.

---

## North Star (vision of record)

An AI-powered personal operating system for people with ADHD — an **external executive-function layer**
that decides what matters, breaks it down, schedules it, remembers it, and adapts when life changes.
The user should feel like someone is helping them manage life, not like they're managing software.

## The one bet (the wedge / moat)

Clarity catches the user **the moment they drift** and re-rails them to the one task that matters, then
learns what pulls them away. Competitors *plan* the day (Motion) or *organize* it (Saner); none are present
at the moment the day is actually lost. Everything else is in service of this. If a feature doesn't
strengthen the drift wedge, it waits. (The broader "decompose → prioritize → adapt" engine is the north
star the wedge earns its way toward — not the v1 hero.)

---

## Build vs. Integrate (decision rule — apply to EVERY new feature)

Goal: one app the user lives in ("no juggling"), reached without rebuilding the universe. For each feature,
sort it before committing:

- **BUILD it** when it's core to the experience OR cheap to make, AND being the source of truth matters:
  the drift loop, text brain-dump, factual personal memory, task decomposition. These are the product's
  identity — own them.
- **INTEGRATE it** when it's a commodity, heavy to build, and you gain nothing by being the source of
  truth: Google Calendar (plug in, don't build a calendar), wellness data (pull Oura/Whoop, don't build
  hardware), email/Slack later. **Be the hub; rent the spokes.** Integrating is usually the faster, cheaper
  path to "no juggling" than building from scratch.
- **DEFER it** (regardless of build/integrate) until it's not the current tier's job. Sequence beats
  completeness.

Two guardrails:
1. **"A competitor has it" is NOT a reason to skip it.** Coherence wins; being first doesn't. Only let
   competitors affect *positioning* (what you lead the story with), not *what you build*.
2. **Add each integration only when you feel the pain of its absence.** Every integration is permanent
   maintenance and a support surface. The all-in-one is *earned* — be unmissably great at the wedge first,
   then absorb adjacent jobs one at a time. An app that's merely adequate at ten things loses to the one
   that's extraordinary at one.

---

## TIER 0 — v1 (NOW, LOCKED — see the PRD/build spec)

The drift wedge, single-user (n=1), web only, multi-user-ready underneath:
- Capture (simple box — enough to feed the loop)
- Pick the ONE focus task
- **Focus session + mid-session drift check + non-shaming re-rail** (the hero)
- **Drift log** (one-tap: what pulled you away)
- Evening review = **pattern learning** (names your recurring triggers) + persistent memory (coach_state)
- Login / auth

**This tier does not change.** Definition of done: you run a focus session with the drift check daily for
7 straight days, and by day 7 it has named at least one real drift trigger.

---

## TIER 1 — v1.1 / v1.2 (the first additions, only after the loop works)

These are cheap (mostly one extra Claude call or one extra field) and directly strengthen the moat:
- **AI task decomposition** — "I need to do my taxes" → an ordered list of small subtasks. *Highest-value
  next feature.* This is arguably the heart of the product; it's deliberately held one step back only
  so the core loop ships first.
- **Brain Dump Mode (text)** — a big box: paste/type a stream-of-consciousness and one Claude call extracts
  tasks, projects, deadlines, and people, then prioritizes. It's the intake-side twin of decomposition and
  cheap to build. NOTE: this is Saner.ai's signature strength, so it's a capture *upgrade*, not a
  differentiator — the drift wedge is what sets us apart. Voice version is Tier 2 (needs speech-to-text).
- **T-shirt sizing (XS–XL)** — AI estimates effort/time/mental load per task. It's just one more field
  the AI fills in; nearly free once the loop exists.
- **Energy-based ordering (self-reported)** — capture energy 1–10; order tasks (hard work in high-energy
  windows). No hardware needed.
- **Simple momentum/streak display** — one number, not a game system.

---

## TIER 2 — v2 (after real daily usage; maybe first other users)

- **Fast mobile capture + voice brain-dump** — phone home-screen widget + share-sheet + one-tap voice
  *memo* that transcribes, including a spoken brain-dump ("talk for 3 minutes" → extracted items). Solves
  the job voice was meant to solve, without a custom wake word.
- **Personal Memory System (factual second brain)** — store arbitrary life facts ("my attorney is Mike
  Smith"; "the dog gets Bordetella every October") and recall them in plain English ("when does Kratos
  need vaccines?"). NOTE: this is a *different job* from the drift wedge — it's notes + natural-language
  retrieval, which pulls in the vector-search infra deliberately cut from v1, and overlaps Saner's
  knowledge graph. Until built, this need is fully met by the separate Claude Project (chat-with-memory).
  Behavioral memory (drift patterns) already lives in v1's coach_state; this is the *factual* layer.
- **Weekly sprint planning** — work/personal/health/financial/relationship/learning goals → weekly plan.
- **Routines** — morning, evening, workday startup/shutdown, custom.
- **Onboarding-as-coach** — intelligent questions configure the app (not a settings screen).
- **Calendar read + write (Google first)** — time blocking, conflict detection, auto-reschedule.

---

## TIER 3 — later (needs scale, money, or a teammate)

- Wellness device integrations (Apple Health, Oura, Whoop, Garmin) feeding the energy signal.
- Collaboration / shared projects (partner, family, accountability partner, coach, manager).
- Distraction management + OS-level focus modes.
- Full gamification system (XP, levels, scores, unlockables).
- Broad integration list (Slack, Notion, Jira, Todoist, Asana, Zapier, Make, M365, open API).
- Custom ADHD profiles (attention vs. impulsivity vs. emotional regulation, etc.).
- Native mobile app (React Native).

---

## RECONSIDER / I'd push back (founder notes)

- **Voice wake-phrase "Hey Clarity" as a core differentiator** → rethink. Always-on wake-word detection
  is the hardest, most gatekept, most capital-intensive piece in the vision. Solve the underlying job
  (fast capture) with a widget + transcribed voice memo instead. Wake word is a v3, post-funding bet.
- **The broad integration list** → each integration is permanent maintenance and a support surface. Add
  one only when a real user is blocked without it. Resist building integrations speculatively.
- **"Category creator" as a build driver** → it's a fundraising/marketing narrative, not a scope. One
  feature working extremely well creates the category. Don't let the phrase justify feature sprawl.

---

## BUSINESS TRACK (parked until v1 proves the loop)

Listed so it's covered — explicitly **not now**. Pulling these forward before you have a working,
self-used product is the classic way to burn months on slides instead of software.
- Validate with **real users** (using it yourself is de-risking, not market validation).
- Competitor scan — DONE (see chat synthesis: closest players are Saner.ai, Motion, and the AI-coach
  cluster; the drift-catch wedge is the identified whitespace).
- Differentiators, positioning — wedge defined (drift-catch); revisit go-to-market messaging later.
- Pricing, monetization, go-to-market.
- Investor pitch materials, user stories / epics, wireframes.

When v1 hits its definition of done, pick ONE item from this track and we run it properly.
