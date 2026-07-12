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

alter table public.families enable row level security;
alter table public.family_users enable row level security;

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
