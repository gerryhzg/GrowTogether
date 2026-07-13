create extension if not exists pgcrypto;

create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  room_code text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.family_users (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null,
  role text not null check (role in ('child', 'parent')),
  emoji text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.interest_ratings (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  interest text not null,
  rating integer not null check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  unique (family_id, interest)
);

create table if not exists public.journeys (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  goal_title text not null,
  goal_description text not null,
  target_count integer not null check (target_count > 0),
  current_count integer not null default 0 check (current_count >= 0),
  unit text not null,
  linked_interest text not null,
  status text not null default 'active' check (status in ('draft', 'active', 'completed')),
  approved_by_parent boolean not null default false,
  parent_override boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.check_ins (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  journey_id uuid not null references public.journeys(id) on delete cascade,
  progress_added integer not null check (progress_added > 0),
  reflection_question text not null,
  child_answer text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.parent_support (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  journey_id uuid not null references public.journeys(id) on delete cascade,
  summary text not null,
  encouragement_text text not null,
  activity_suggestion text not null,
  created_at timestamptz not null default now()
);

create or replace function public.increment_journey_progress(journey_id uuid, amount integer)
returns void
language sql
as $$
  update public.journeys
  set current_count = least(target_count, current_count + $2),
      updated_at = now()
  where id = $1;
$$;

alter table public.families enable row level security;
alter table public.family_users enable row level security;
alter table public.interest_ratings enable row level security;
alter table public.journeys enable row level security;
alter table public.check_ins enable row level security;
alter table public.parent_support enable row level security;

grant usage on schema public to anon;
grant select, insert, update, delete on public.families to anon;
grant select, insert, update, delete on public.family_users to anon;
grant select, insert, update, delete on public.interest_ratings to anon;
grant select, insert, update, delete on public.journeys to anon;
grant select, insert, update, delete on public.check_ins to anon;
grant select, insert, update, delete on public.parent_support to anon;
grant execute on function public.increment_journey_progress(uuid, integer) to anon;

drop policy if exists "Allow anon family lookup" on public.families;
create policy "Allow anon family lookup"
on public.families
for select
to anon
using (true);

drop policy if exists "Allow anon family creation" on public.families;
create policy "Allow anon family creation"
on public.families
for insert
to anon
with check (true);

drop policy if exists "Allow anon family user lookup" on public.family_users;
create policy "Allow anon family user lookup"
on public.family_users
for select
to anon
using (true);

drop policy if exists "Allow anon family user creation" on public.family_users;
create policy "Allow anon family user creation"
on public.family_users
for insert
to anon
with check (true);

drop policy if exists "Allow anon interest rating lookup" on public.interest_ratings;
create policy "Allow anon interest rating lookup"
on public.interest_ratings
for select
to anon
using (true);

drop policy if exists "Allow anon interest rating creation" on public.interest_ratings;
create policy "Allow anon interest rating creation"
on public.interest_ratings
for insert
to anon
with check (true);

drop policy if exists "Allow anon interest rating update" on public.interest_ratings;
create policy "Allow anon interest rating update"
on public.interest_ratings
for update
to anon
using (true)
with check (true);

drop policy if exists "Allow anon interest rating deletion" on public.interest_ratings;
create policy "Allow anon interest rating deletion"
on public.interest_ratings
for delete
to anon
using (true);

drop policy if exists "Allow anon journey lookup" on public.journeys;
create policy "Allow anon journey lookup"
on public.journeys
for select
to anon
using (true);

drop policy if exists "Allow anon journey creation" on public.journeys;
create policy "Allow anon journey creation"
on public.journeys
for insert
to anon
with check (true);

drop policy if exists "Allow anon journey update" on public.journeys;
create policy "Allow anon journey update"
on public.journeys
for update
to anon
using (true)
with check (true);

drop policy if exists "Allow anon journey deletion" on public.journeys;
create policy "Allow anon journey deletion"
on public.journeys
for delete
to anon
using (true);

drop policy if exists "Allow anon check in lookup" on public.check_ins;
create policy "Allow anon check in lookup"
on public.check_ins
for select
to anon
using (true);

drop policy if exists "Allow anon check in creation" on public.check_ins;
create policy "Allow anon check in creation"
on public.check_ins
for insert
to anon
with check (true);

drop policy if exists "Allow anon check in update" on public.check_ins;
create policy "Allow anon check in update"
on public.check_ins
for update
to anon
using (true)
with check (true);

drop policy if exists "Allow anon check in deletion" on public.check_ins;
create policy "Allow anon check in deletion"
on public.check_ins
for delete
to anon
using (true);

drop policy if exists "Allow anon parent support lookup" on public.parent_support;
create policy "Allow anon parent support lookup"
on public.parent_support
for select
to anon
using (true);

drop policy if exists "Allow anon parent support creation" on public.parent_support;
create policy "Allow anon parent support creation"
on public.parent_support
for insert
to anon
with check (true);

drop policy if exists "Allow anon parent support update" on public.parent_support;
create policy "Allow anon parent support update"
on public.parent_support
for update
to anon
using (true)
with check (true);

drop policy if exists "Allow anon parent support deletion" on public.parent_support;
create policy "Allow anon parent support deletion"
on public.parent_support
for delete
to anon
using (true);
