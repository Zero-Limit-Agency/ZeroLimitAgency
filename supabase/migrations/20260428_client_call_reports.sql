create table if not exists public.client_call_reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  application_id uuid not null unique references public.applications(id) on delete cascade,
  call_type text not null default 'intro',
  raw_notes text,
  client_summary text,
  suggested_email text,
  suggested_timeline_events jsonb not null default '[]'::jsonb,
  internal_tasks jsonb not null default '[]'::jsonb,
  important_dates jsonb not null default '[]'::jsonb,
  status text not null default 'draft',
  constraint client_call_reports_status_check check (
    status in ('draft', 'applied', 'sent')
  )
);

create index if not exists client_call_reports_application_id_idx
  on public.client_call_reports (application_id);

drop trigger if exists set_client_call_reports_updated_at on public.client_call_reports;

create trigger set_client_call_reports_updated_at
before update on public.client_call_reports
for each row
execute function public.set_updated_at();

alter table public.client_call_reports enable row level security;
