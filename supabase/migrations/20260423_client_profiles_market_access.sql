alter table public.client_profiles
  add column if not exists market_access_enabled boolean not null default false;
