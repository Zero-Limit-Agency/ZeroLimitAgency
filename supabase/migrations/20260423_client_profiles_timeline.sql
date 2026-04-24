alter table public.client_profiles
  add column if not exists timeline_events jsonb not null default '[]'::jsonb;
