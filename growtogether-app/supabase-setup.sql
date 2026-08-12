create extension if not exists pgcrypto;

create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  room_code text not null unique,
  created_at timestamptz not null default now()
);

alter table public.families
add column if not exists created_by uuid references auth.users(id) on delete set null;

create table if not exists public.family_users (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null,
  role text not null check (role in ('child', 'parent')),
  emoji text not null,
  created_at timestamptz not null default now()
);

alter table public.family_users
add column if not exists auth_user_id uuid references auth.users(id) on delete cascade;

create unique index if not exists family_users_auth_user_id_unique
on public.family_users(auth_user_id)
where auth_user_id is not null;

create index if not exists family_users_family_id_idx
on public.family_users(family_id);

create index if not exists family_users_auth_user_family_idx
on public.family_users(auth_user_id, family_id);

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

create or replace function public.is_family_member(target_family_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.family_users
    where family_id = target_family_id
      and auth_user_id = auth.uid()
  );
$$;

create or replace function public.current_user_family_role(target_family_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select role
  from public.family_users
  where family_id = target_family_id
    and auth_user_id = auth.uid()
  limit 1;
$$;

drop function if exists public.create_family_for_current_user(text, text, text);
drop function if exists public.join_family_by_code(text, text, text, text);

create or replace function public.create_family_for_current_user(
  p_room_code text,
  p_name text,
  p_emoji text
)
returns table (
  id uuid,
  name text,
  role text,
  emoji text,
  family_id uuid,
  room_code text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_auth_user_id uuid := auth.uid();
  v_room_code text := upper(trim(p_room_code));
  v_name text := trim(p_name);
  v_family_id uuid;
  v_profile_id uuid;
begin
  if v_auth_user_id is null then
    raise exception 'You must be signed in to create a family.';
  end if;

  if v_room_code = '' then
    raise exception 'Family code is required.';
  end if;

  if v_name = '' then
    raise exception 'Name is required.';
  end if;

  if exists (
    select 1 from public.family_users where auth_user_id = v_auth_user_id
  ) then
    raise exception 'This account already belongs to a family.';
  end if;

  insert into public.families (room_code, created_by)
  values (v_room_code, v_auth_user_id)
  returning families.id into v_family_id;

  insert into public.family_users (family_id, auth_user_id, name, role, emoji)
  values (v_family_id, v_auth_user_id, v_name, 'parent', p_emoji)
  returning family_users.id into v_profile_id;

  return query
  select v_profile_id, v_name, 'parent'::text, p_emoji, v_family_id, v_room_code;
exception
  when unique_violation then
    raise exception 'Family code already exists. Choose a harder-to-guess code.';
end;
$$;

create or replace function public.join_family_by_code(
  p_room_code text,
  p_name text,
  p_role text,
  p_emoji text
)
returns table (
  id uuid,
  name text,
  role text,
  emoji text,
  family_id uuid,
  room_code text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_auth_user_id uuid := auth.uid();
  v_room_code text := upper(trim(p_room_code));
  v_name text := trim(p_name);
  v_family_id uuid;
  v_profile_id uuid;
begin
  if v_auth_user_id is null then
    raise exception 'You must be signed in to join a family.';
  end if;

  if p_role <> 'child' then
    raise exception 'Only child accounts can join with a family code.';
  end if;

  if v_room_code = '' then
    raise exception 'Family code is required.';
  end if;

  if v_name = '' then
    raise exception 'Name is required.';
  end if;

  if exists (
    select 1 from public.family_users where auth_user_id = v_auth_user_id
  ) then
    raise exception 'This account already belongs to a family.';
  end if;

  select families.id
  into v_family_id
  from public.families
  where families.room_code = v_room_code;

  if v_family_id is null then
    raise exception 'Family code was not found. Ask your parent to create it first.';
  end if;

  insert into public.family_users (family_id, auth_user_id, name, role, emoji)
  values (v_family_id, v_auth_user_id, v_name, 'child', p_emoji)
  returning family_users.id into v_profile_id;

  return query
  select v_profile_id, v_name, 'child'::text, p_emoji, v_family_id, v_room_code;
end;
$$;

create or replace function public.increment_journey_progress(journey_id uuid, amount integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_family_id uuid;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to update progress.';
  end if;

  if amount < 1 then
    raise exception 'Progress amount must be positive.';
  end if;

  select family_id
  into v_family_id
  from public.journeys
  where id = $1;

  if v_family_id is null then
    raise exception 'Journey was not found.';
  end if;

  if public.current_user_family_role(v_family_id) <> 'child' then
    raise exception 'Only child accounts can update journey progress.';
  end if;

  update public.journeys
  set current_count = least(target_count, current_count + $2),
      updated_at = now()
  where id = $1;
end;
$$;

alter table public.families enable row level security;
alter table public.family_users enable row level security;
alter table public.interest_ratings enable row level security;
alter table public.journeys enable row level security;
alter table public.check_ins enable row level security;
alter table public.parent_support enable row level security;

revoke all on public.families from anon;
revoke all on public.family_users from anon;
revoke all on public.interest_ratings from anon;
revoke all on public.journeys from anon;
revoke all on public.check_ins from anon;
revoke all on public.parent_support from anon;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.families to authenticated;
grant select, insert, update, delete on public.family_users to authenticated;
grant select, insert, update, delete on public.interest_ratings to authenticated;
grant select, insert, update, delete on public.journeys to authenticated;
grant select, insert, update, delete on public.check_ins to authenticated;
grant select, insert, update, delete on public.parent_support to authenticated;

revoke execute on function public.is_family_member(uuid) from anon;
revoke execute on function public.current_user_family_role(uuid) from anon;
revoke execute on function public.create_family_for_current_user(text, text, text) from anon;
revoke execute on function public.join_family_by_code(text, text, text, text) from anon;
revoke execute on function public.increment_journey_progress(uuid, integer) from anon;

grant execute on function public.is_family_member(uuid) to authenticated;
grant execute on function public.current_user_family_role(uuid) to authenticated;
grant execute on function public.create_family_for_current_user(text, text, text) to authenticated;
grant execute on function public.join_family_by_code(text, text, text, text) to authenticated;
grant execute on function public.increment_journey_progress(uuid, integer) to authenticated;

drop policy if exists "Allow anon family lookup" on public.families;
drop policy if exists "Allow anon family creation" on public.families;
drop policy if exists "Family members can read families" on public.families;
create policy "Family members can read families"
on public.families
for select
to authenticated
using (public.is_family_member(id));

drop policy if exists "Allow anon family user lookup" on public.family_users;
drop policy if exists "Allow anon family user creation" on public.family_users;
drop policy if exists "Family members can read family users" on public.family_users;
create policy "Family members can read family users"
on public.family_users
for select
to authenticated
using (public.is_family_member(family_id));

drop policy if exists "Allow anon interest rating lookup" on public.interest_ratings;
drop policy if exists "Allow anon interest rating creation" on public.interest_ratings;
drop policy if exists "Allow anon interest rating update" on public.interest_ratings;
drop policy if exists "Allow anon interest rating deletion" on public.interest_ratings;
drop policy if exists "Family members can read interest ratings" on public.interest_ratings;
drop policy if exists "Children can create interest ratings" on public.interest_ratings;
drop policy if exists "Children can update interest ratings" on public.interest_ratings;
drop policy if exists "Children can delete interest ratings" on public.interest_ratings;
create policy "Family members can read interest ratings"
on public.interest_ratings
for select
to authenticated
using (public.is_family_member(family_id));
create policy "Children can create interest ratings"
on public.interest_ratings
for insert
to authenticated
with check (public.current_user_family_role(family_id) = 'child');
create policy "Children can update interest ratings"
on public.interest_ratings
for update
to authenticated
using (public.current_user_family_role(family_id) = 'child')
with check (public.current_user_family_role(family_id) = 'child');
create policy "Children can delete interest ratings"
on public.interest_ratings
for delete
to authenticated
using (public.current_user_family_role(family_id) = 'child');

drop policy if exists "Allow anon journey lookup" on public.journeys;
drop policy if exists "Allow anon journey creation" on public.journeys;
drop policy if exists "Allow anon journey update" on public.journeys;
drop policy if exists "Allow anon journey deletion" on public.journeys;
drop policy if exists "Family members can read journeys" on public.journeys;
drop policy if exists "Children can create journeys" on public.journeys;
drop policy if exists "Parents can update journeys" on public.journeys;
create policy "Family members can read journeys"
on public.journeys
for select
to authenticated
using (public.is_family_member(family_id));
create policy "Children can create journeys"
on public.journeys
for insert
to authenticated
with check (public.current_user_family_role(family_id) = 'child');
create policy "Parents can update journeys"
on public.journeys
for update
to authenticated
using (public.current_user_family_role(family_id) = 'parent')
with check (public.current_user_family_role(family_id) = 'parent');

drop policy if exists "Allow anon check in lookup" on public.check_ins;
drop policy if exists "Allow anon check in creation" on public.check_ins;
drop policy if exists "Allow anon check in update" on public.check_ins;
drop policy if exists "Allow anon check in deletion" on public.check_ins;
drop policy if exists "Family members can read check ins" on public.check_ins;
drop policy if exists "Children can create check ins" on public.check_ins;
create policy "Family members can read check ins"
on public.check_ins
for select
to authenticated
using (public.is_family_member(family_id));
create policy "Children can create check ins"
on public.check_ins
for insert
to authenticated
with check (
  public.current_user_family_role(family_id) = 'child'
  and exists (
    select 1
    from public.journeys
    where journeys.id = journey_id
      and journeys.family_id = check_ins.family_id
  )
);

drop policy if exists "Allow anon parent support lookup" on public.parent_support;
drop policy if exists "Allow anon parent support creation" on public.parent_support;
drop policy if exists "Allow anon parent support update" on public.parent_support;
drop policy if exists "Allow anon parent support deletion" on public.parent_support;
drop policy if exists "Family members can read parent support" on public.parent_support;
drop policy if exists "Parents can create parent support" on public.parent_support;
drop policy if exists "Parents can update parent support" on public.parent_support;
drop policy if exists "Parents can delete parent support" on public.parent_support;
create policy "Family members can read parent support"
on public.parent_support
for select
to authenticated
using (public.is_family_member(family_id));
create policy "Parents can create parent support"
on public.parent_support
for insert
to authenticated
with check (
  public.current_user_family_role(family_id) = 'parent'
  and exists (
    select 1
    from public.journeys
    where journeys.id = journey_id
      and journeys.family_id = parent_support.family_id
  )
);
create policy "Parents can update parent support"
on public.parent_support
for update
to authenticated
using (public.current_user_family_role(family_id) = 'parent')
with check (public.current_user_family_role(family_id) = 'parent');
create policy "Parents can delete parent support"
on public.parent_support
for delete
to authenticated
using (public.current_user_family_role(family_id) = 'parent');
