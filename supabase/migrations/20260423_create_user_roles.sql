create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  role text not null,
  constraint user_roles_role_check check (
    role in ('admin', 'client')
  )
);

create index if not exists user_roles_role_idx
  on public.user_roles (role);

drop trigger if exists set_user_roles_updated_at on public.user_roles;

create trigger set_user_roles_updated_at
before update on public.user_roles
for each row
execute function public.set_updated_at();

alter table public.user_roles enable row level security;
