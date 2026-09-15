-- Task Manager schema
-- Run this in the Supabase SQL editor (Project > SQL Editor > New query).
-- Safe to re-run: every statement is idempotent, so running this again after
-- an earlier version already ran (e.g. before groups existed) just adds the
-- missing pieces.

create extension if not exists pgcrypto;

do $$ begin
  create type task_status as enum ('aberto', 'desenvolvimento', 'concluido');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type task_urgency as enum ('baixa', 'media', 'alta');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type group_role as enum ('admin', 'member');
exception
  when duplicate_object then null;
end $$;

-- Mirrors auth.users (email/name) so users are queryable and embeddable via
-- the normal Postgres/PostgREST API — auth.users itself isn't exposed.
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  created_at timestamptz not null default now()
);

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Backfill profiles for users created before this trigger existed.
insert into profiles (id, email, full_name)
select id, email, raw_user_meta_data ->> 'full_name'
from auth.users
on conflict (id) do nothing;

create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) > 0),
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists group_members (
  group_id uuid not null references groups (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  role group_role not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table if not exists group_invites (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups (id) on delete cascade,
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  max_uses integer,
  uses_count integer not null default 0,
  revoked_at timestamptz
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references groups (id) on delete cascade,
  description text not null check (char_length(btrim(description)) > 0),
  requester text not null check (char_length(btrim(requester)) > 0),
  assignee_id uuid references profiles (id) on delete set null,
  urgency task_urgency not null default 'media',
  observations text,
  status task_status not null default 'aberto',
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add columns for installs that ran an earlier version of this schema
-- (before groups existed).
alter table tasks add column if not exists group_id uuid references groups (id) on delete cascade;
alter table tasks add column if not exists assignee_id uuid references profiles (id) on delete set null;

create index if not exists tasks_group_status_assignee_position_idx
  on tasks (group_id, status, assignee_id, position);
create index if not exists group_members_user_idx on group_members (user_id);
create index if not exists group_invites_group_idx on group_invites (group_id);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tasks_set_updated_at on tasks;
create trigger tasks_set_updated_at
before update on tasks
for each row execute function set_updated_at();

-- Row Level Security is enabled with no public policies on every table
-- below: the app talks to Postgres exclusively through the server (service
-- role key), which bypasses RLS, and enforces group membership/roles in
-- application code (see src/app/*actions.ts). Nothing here is reachable
-- directly from the browser.
alter table profiles enable row level security;
alter table groups enable row level security;
alter table group_members enable row level security;
alter table group_invites enable row level security;
alter table tasks enable row level security;
