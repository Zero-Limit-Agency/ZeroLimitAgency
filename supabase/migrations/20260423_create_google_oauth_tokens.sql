create table if not exists public.google_oauth_tokens (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  provider text not null unique,
  google_email text,
  google_display_name text,
  access_token text not null,
  refresh_token text,
  token_type text,
  scope text,
  expires_at timestamptz,
  last_refreshed_at timestamptz not null default timezone('utc', now())
);

create index if not exists google_oauth_tokens_google_email_idx
  on public.google_oauth_tokens (google_email);

drop trigger if exists set_google_oauth_tokens_updated_at on public.google_oauth_tokens;

create trigger set_google_oauth_tokens_updated_at
before update on public.google_oauth_tokens
for each row
execute function public.set_updated_at();

alter table public.google_oauth_tokens enable row level security;
