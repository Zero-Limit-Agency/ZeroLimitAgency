alter table public.client_profiles
  add column if not exists space_status text not null default 'preparing';

alter table public.client_profiles
  drop constraint if exists client_profiles_space_status_check;

alter table public.client_profiles
  add constraint client_profiles_space_status_check
  check (space_status in ('preparing', 'active'));
