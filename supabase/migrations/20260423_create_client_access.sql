create table if not exists public.client_access (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  application_id uuid not null unique references public.applications(id) on delete cascade,
  email text not null,
  status text not null default 'active',
  constraint client_access_status_check check (
    status in ('active', 'revoked')
  )
);

create index if not exists client_access_email_idx
  on public.client_access (email);

drop trigger if exists set_client_access_updated_at on public.client_access;

create trigger set_client_access_updated_at
before update on public.client_access
for each row
execute function public.set_updated_at();

alter table public.client_access enable row level security;
