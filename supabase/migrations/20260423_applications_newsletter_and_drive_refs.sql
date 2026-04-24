alter table public.applications
  add column if not exists newsletter_opt_in boolean not null default false,
  add column if not exists drive_folder_id text,
  add column if not exists drive_folder_url text;

create table if not exists public.newsletter_subscriptions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  email text not null unique,
  status text not null default 'subscribed',
  source text not null default 'contact_form',
  language text,
  country text,
  application_id uuid references public.applications(id) on delete set null,
  subscribed_at timestamptz not null default timezone('utc', now()),
  unsubscribed_at timestamptz,
  constraint newsletter_subscriptions_status_check check (
    status in ('subscribed', 'unsubscribed')
  )
);

create index if not exists newsletter_subscriptions_status_idx
  on public.newsletter_subscriptions (status);

create index if not exists newsletter_subscriptions_application_id_idx
  on public.newsletter_subscriptions (application_id);

drop trigger if exists set_newsletter_subscriptions_updated_at on public.newsletter_subscriptions;

create trigger set_newsletter_subscriptions_updated_at
before update on public.newsletter_subscriptions
for each row
execute function public.set_updated_at();

alter table public.newsletter_subscriptions enable row level security;
