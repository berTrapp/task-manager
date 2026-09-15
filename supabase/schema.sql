-- Task Manager schema
-- Run this in the Supabase SQL editor (Project > SQL Editor > New query).

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

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  description text not null check (char_length(btrim(description)) > 0),
  requester text not null check (char_length(btrim(requester)) > 0),
  urgency task_urgency not null default 'media',
  observations text,
  status task_status not null default 'aberto',
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_status_position_idx on tasks (status, position);

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

-- Row Level Security is enabled with no public policies: the app talks to
-- this table exclusively through the server (service role key), which
-- bypasses RLS. Nothing here is reachable directly from the browser.
alter table tasks enable row level security;
