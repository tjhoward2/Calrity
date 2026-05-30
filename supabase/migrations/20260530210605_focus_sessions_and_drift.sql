-- M2: focus sessions, drift events, and coach_state.
-- Per PRD §8.1 / §8.2 / §8.3.
--
-- coach_state holds the per-user JSON blob whose `drift_patterns` array is
-- read by the re-rail (PRD §10.2b) and written by the evening review
-- (PRD §10.3, M3). For M2 the array stays empty; the re-rail handles that.

create type session_outcome as enum ('completed', 'abandoned', 'drifted_back');
create type drift_reason as enum (
  'tab_site',
  'person_message',
  'thought',
  'other',
  'unspecified'
);

create table focus_sessions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  item_id         uuid references items(id) on delete set null,
  planned_minutes int not null default 25
                    check (planned_minutes between 5 and 120),
  drift_check_at  int check (drift_check_at is null or drift_check_at > 0),
  started_at      timestamptz not null default now(),
  ended_at        timestamptz,
  outcome         session_outcome,
  rerail_count    int not null default 0 check (rerail_count >= 0)
);

create index focus_sessions_user_started_idx
  on focus_sessions (user_id, started_at desc);

create table drift_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  session_id  uuid not null references focus_sessions(id) on delete cascade,
  reason      drift_reason not null default 'unspecified',
  note        text check (note is null or char_length(note) <= 280),
  returned    boolean not null default false,
  at          timestamptz not null default now()
);

create index drift_events_user_at_idx on drift_events (user_id, at desc);
create index drift_events_session_idx on drift_events (session_id);

create table coach_state (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null unique references auth.users(id) on delete cascade,
  state      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create trigger coach_state_set_updated_at
  before update on coach_state
  for each row execute function set_updated_at();

-- RLS: account isolation. Mirrors items: own rows only, auth.uid()-scoped.
alter table focus_sessions enable row level security;
alter table drift_events   enable row level security;
alter table coach_state    enable row level security;

create policy "own sessions" on focus_sessions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "own drift_events" on drift_events
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "own coach_state" on coach_state
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Defense-in-depth: API role grants.
grant select, insert, update, delete on focus_sessions to authenticated;
grant select, insert, update, delete on drift_events   to authenticated;
grant select, insert, update, delete on coach_state    to authenticated;
