-- M1: items + the enums it references.
-- Other v1 enums (log_type, session_outcome, drift_reason) and tables
-- (daily_logs, coach_state, focus_sessions, drift_events) are created in M2+.

create type item_status as enum ('inbox', 'active', 'done', 'parked');
create type effort_size as enum ('xs', 's', 'm', 'l', 'xl');
create type energy_level as enum ('low', 'med', 'high');

create table items (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  content       text not null check (char_length(content) between 1 and 2000),
  status        item_status not null default 'inbox',
  importance    int check (importance is null or importance between 1 and 5),
  effort        effort_size,
  energy        energy_level,
  urgency       int check (urgency is null or urgency between 1 and 5),
  parent_id     uuid references items(id) on delete cascade,
  scheduled_for date,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  completed_at  timestamptz
);

create index items_user_status_idx on items (user_id, status);
create index items_user_sched_idx  on items (user_id, scheduled_for);

-- Keep updated_at fresh on every row mutation.
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger items_set_updated_at
  before update on items
  for each row execute function set_updated_at();

-- RLS: account isolation. PRD §5 US-A1 + §8.3.
alter table items enable row level security;

create policy "own items" on items
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Defense-in-depth: API role grants. RLS still controls row visibility.
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on items to authenticated;
