create table if not exists public.global_site_settings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  key text not null unique,
  settings jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id) on delete set null
);

create index if not exists global_site_settings_key_idx
  on public.global_site_settings (key);

drop trigger if exists set_global_site_settings_updated_at on public.global_site_settings;

create trigger set_global_site_settings_updated_at
before update on public.global_site_settings
for each row
execute function public.set_updated_at();

alter table public.global_site_settings enable row level security;

