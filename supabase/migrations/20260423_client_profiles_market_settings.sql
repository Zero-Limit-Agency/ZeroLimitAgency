alter table public.client_profiles
  add column if not exists market_settings jsonb not null default '{}'::jsonb;
