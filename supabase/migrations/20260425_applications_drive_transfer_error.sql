alter table public.applications
  add column if not exists drive_transfer_error text;
