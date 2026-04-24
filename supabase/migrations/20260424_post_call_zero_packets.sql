create table if not exists public.post_call_zero_packets (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  application_id uuid not null unique references public.applications(id) on delete cascade,
  summary_message text,
  welcome_folder_url text,
  quote_url text,
  contract_url text,
  payment_url text,
  status text not null default 'draft',
  sent_at timestamptz,
  last_sent_at timestamptz,
  last_email_error text,
  constraint post_call_zero_packets_status_check check (
    status in ('draft', 'ready', 'sent')
  )
);

create index if not exists post_call_zero_packets_application_id_idx
  on public.post_call_zero_packets (application_id);

drop trigger if exists set_post_call_zero_packets_updated_at on public.post_call_zero_packets;

create trigger set_post_call_zero_packets_updated_at
before update on public.post_call_zero_packets
for each row
execute function public.set_updated_at();

alter table public.post_call_zero_packets enable row level security;
