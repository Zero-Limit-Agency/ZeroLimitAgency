-- Full-site security remediation: executable RLS policies, audit log and entitlement foundation.
-- Idempotent and non-destructive. Does not remove legacy data or secrets.

create extension if not exists pgcrypto;

create or replace function public.is_admin_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'admin'
  );
$$;

revoke all on function public.is_admin_user() from public;
grant execute on function public.is_admin_user() to authenticated;

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_role text,
  action text not null,
  resource_type text not null,
  resource_id text,
  result text not null default 'success',
  metadata jsonb not null default '{}'::jsonb,
  constraint audit_logs_result_check check (result in ('success', 'failure'))
);

create index if not exists audit_logs_created_at_idx on public.audit_logs (created_at desc);
create index if not exists audit_logs_actor_user_id_idx on public.audit_logs (actor_user_id);
create index if not exists audit_logs_resource_idx on public.audit_logs (resource_type, resource_id);

alter table public.audit_logs enable row level security;

drop policy if exists audit_logs_admin_select on public.audit_logs;
create policy audit_logs_admin_select on public.audit_logs
  for select to authenticated
  using (public.is_admin_user());

create table if not exists public.entitlements (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_key text not null,
  source text not null default 'manual',
  status text not null default 'active',
  activated_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz,
  revoked_at timestamptz,
  revoked_reason text,
  payment_reference text,
  metadata jsonb not null default '{}'::jsonb,
  constraint entitlements_status_check check (status in ('active', 'revoked', 'expired', 'pending')),
  constraint entitlements_product_key_check check (product_key ~ '^[a-z0-9][a-z0-9._:-]{1,120}$')
);

create unique index if not exists entitlements_active_unique_idx
  on public.entitlements (user_id, product_key)
  where status = 'active';

create index if not exists entitlements_user_status_idx
  on public.entitlements (user_id, status);

drop trigger if exists set_entitlements_updated_at on public.entitlements;
create trigger set_entitlements_updated_at
before update on public.entitlements
for each row
execute function public.set_updated_at();

alter table public.entitlements enable row level security;

drop policy if exists entitlements_self_or_admin_select on public.entitlements;
create policy entitlements_self_or_admin_select on public.entitlements
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin_user());

drop policy if exists entitlements_admin_insert on public.entitlements;
create policy entitlements_admin_insert on public.entitlements
  for insert to authenticated
  with check (public.is_admin_user());

drop policy if exists entitlements_admin_update on public.entitlements;
create policy entitlements_admin_update on public.entitlements
  for update to authenticated
  using (public.is_admin_user())
  with check (public.is_admin_user());

drop policy if exists user_roles_self_select on public.user_roles;
create policy user_roles_self_select on public.user_roles
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin_user());

drop policy if exists client_access_self_or_admin_select on public.client_access;
create policy client_access_self_or_admin_select on public.client_access
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin_user());

drop policy if exists client_profiles_self_or_admin_select on public.client_profiles;
create policy client_profiles_self_or_admin_select on public.client_profiles
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin_user());

drop policy if exists applications_self_or_admin_select on public.applications;
create policy applications_self_or_admin_select on public.applications
  for select to authenticated
  using (
    public.is_admin_user()
    or exists (
      select 1
      from public.client_access ca
      where ca.application_id = applications.id
        and ca.user_id = auth.uid()
        and ca.status = 'active'
    )
  );

drop policy if exists client_collaboration_messages_self_or_admin_select on public.client_collaboration_messages;
create policy client_collaboration_messages_self_or_admin_select on public.client_collaboration_messages
  for select to authenticated
  using (
    public.is_admin_user()
    or exists (
      select 1
      from public.client_access ca
      where ca.application_id = client_collaboration_messages.application_id
        and ca.user_id = auth.uid()
        and ca.status = 'active'
    )
  );

drop policy if exists post_call_zero_packets_self_or_admin_select on public.post_call_zero_packets;
create policy post_call_zero_packets_self_or_admin_select on public.post_call_zero_packets
  for select to authenticated
  using (
    public.is_admin_user()
    or exists (
      select 1
      from public.client_access ca
      where ca.application_id = post_call_zero_packets.application_id
        and ca.user_id = auth.uid()
        and ca.status = 'active'
    )
  );

drop policy if exists client_call_reports_admin_only_select on public.client_call_reports;
create policy client_call_reports_admin_only_select on public.client_call_reports
  for select to authenticated
  using (public.is_admin_user());

drop policy if exists google_oauth_tokens_admin_only_select on public.google_oauth_tokens;
create policy google_oauth_tokens_admin_only_select on public.google_oauth_tokens
  for select to authenticated
  using (public.is_admin_user());

drop policy if exists global_site_settings_admin_only_select on public.global_site_settings;
create policy global_site_settings_admin_only_select on public.global_site_settings
  for select to authenticated
  using (public.is_admin_user());

drop policy if exists global_market_settings_admin_only_select on public.global_market_settings;
create policy global_market_settings_admin_only_select on public.global_market_settings
  for select to authenticated
  using (public.is_admin_user());

drop policy if exists dropmap_settings_admin_only_select on public.dropmap_settings;
create policy dropmap_settings_admin_only_select on public.dropmap_settings
  for select to authenticated
  using (public.is_admin_user());
