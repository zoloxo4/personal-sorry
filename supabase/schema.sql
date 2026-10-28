-- Run in Supabase Dashboard > SQL Editor.
-- Analytics tables are only accessed server-side with the service role key.
-- RLS is enabled and no public policies are created intentionally.

create extension if not exists pgcrypto;

create table if not exists public.visits (
  session_id uuid primary key,
  device_category text not null check (device_category in ('mobile','tablet','desktop')),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  landing_path text not null default '/',
  ended_at timestamptz
);

create table if not exists public.page_events (
  id bigint generated always as identity primary key,
  session_id uuid not null,
  event_name text not null,
  page_path text not null default '/',
  created_at timestamptz not null default now()
);

create index if not exists visits_first_seen_idx on public.visits (first_seen_at desc);
create index if not exists page_events_created_idx on public.page_events (created_at desc);
create index if not exists page_events_session_idx on public.page_events (session_id);

alter table public.visits enable row level security;
alter table public.page_events enable row level security;

-- No anon/authenticated policies: browser clients cannot read or write these tables.
-- Server-only API uses SUPABASE_SERVICE_ROLE_KEY, which must never be exposed to browsers.
