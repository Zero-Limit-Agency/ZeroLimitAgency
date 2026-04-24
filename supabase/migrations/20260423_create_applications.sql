create extension if not exists pgcrypto;

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  first_name text not null,
  last_name text not null default '',
  pseudo text,
  email text not null,
  birth_date date not null,
  company text,
  country text not null,
  language text not null,
  request_type text not null,
  message_raw text not null,
  message_rewritten text,
  status text not null default 'pending_review',
  files_folder_url text,
  constraint applications_status_check check (
    status in ('pending_review', 'approved', 'rejected', 'archived')
  )
);

create index if not exists applications_created_at_idx
  on public.applications (created_at desc);

create index if not exists applications_email_idx
  on public.applications (email);

create index if not exists applications_status_idx
  on public.applications (status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_applications_updated_at on public.applications;

create trigger set_applications_updated_at
before update on public.applications
for each row
execute function public.set_updated_at();

alter table public.applications enable row level security;
