alter table public.client_access
  add column if not exists role text not null default 'client',
  add column if not exists activation_email_sent_at timestamptz,
  add column if not exists welcome_email_sent_at timestamptz,
  add column if not exists activated_at timestamptz,
  add column if not exists revoked_at timestamptz,
  add column if not exists last_email_error text;

alter table public.client_access
  drop constraint if exists client_access_status_check;

alter table public.client_access
  add constraint client_access_status_check check (
    status in ('pending_activation', 'active', 'revoked')
  );
