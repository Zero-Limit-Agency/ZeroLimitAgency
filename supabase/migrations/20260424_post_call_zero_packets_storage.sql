insert into storage.buckets (id, name, public)
values ('post-call-zero', 'post-call-zero', false)
on conflict (id) do nothing;

alter table public.post_call_zero_packets
  add column if not exists welcome_file_name text,
  add column if not exists welcome_storage_path text,
  add column if not exists welcome_content_type text,
  add column if not exists quote_file_name text,
  add column if not exists quote_storage_path text,
  add column if not exists quote_content_type text,
  add column if not exists contract_file_name text,
  add column if not exists contract_storage_path text,
  add column if not exists contract_content_type text;

alter table public.post_call_zero_packets
  drop constraint if exists post_call_zero_packets_status_check;

alter table public.post_call_zero_packets
  add constraint post_call_zero_packets_status_check
  check (status in ('draft', 'sent'));

alter table public.post_call_zero_packets
  drop column if exists welcome_folder_url,
  drop column if exists quote_url,
  drop column if exists contract_url;
