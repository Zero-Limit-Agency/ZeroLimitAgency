create table if not exists public.global_market_settings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  key text not null unique,
  settings jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id) on delete set null
);

create index if not exists global_market_settings_key_idx
  on public.global_market_settings (key);

drop trigger if exists set_global_market_settings_updated_at on public.global_market_settings;

create trigger set_global_market_settings_updated_at
before update on public.global_market_settings
for each row
execute function public.set_updated_at();

alter table public.global_market_settings enable row level security;

insert into public.global_market_settings (key, settings)
select
  'fortnite_global_market',
  cp.market_settings
from public.client_profiles cp
where cp.market_settings is not null
  and cp.market_settings <> '{}'::jsonb
order by cp.updated_at desc
limit 1
on conflict (key) do update
set settings = excluded.settings;

alter table public.client_profiles
  drop column if exists market_settings;
