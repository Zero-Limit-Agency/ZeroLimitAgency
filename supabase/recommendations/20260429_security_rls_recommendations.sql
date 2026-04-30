-- Zero Limit Agency - recommended RLS hardening
-- This file is intentionally non-destructive and should be reviewed before execution.
-- It assumes service-role access remains server-side only.

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

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_roles' and policyname = 'user_roles_self_select'
  ) then
    create policy user_roles_self_select
      on public.user_roles
      for select
      to authenticated
      using (user_id = auth.uid());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'client_access' and policyname = 'client_access_self_or_admin_select'
  ) then
    create policy client_access_self_or_admin_select
      on public.client_access
      for select
      to authenticated
      using (user_id = auth.uid() or public.is_admin_user());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'client_profiles' and policyname = 'client_profiles_self_or_admin_select'
  ) then
    create policy client_profiles_self_or_admin_select
      on public.client_profiles
      for select
      to authenticated
      using (user_id = auth.uid() or public.is_admin_user());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'applications' and policyname = 'applications_self_or_admin_select'
  ) then
    create policy applications_self_or_admin_select
      on public.applications
      for select
      to authenticated
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
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'newsletter_subscriptions' and policyname = 'newsletter_admin_only_select'
  ) then
    create policy newsletter_admin_only_select
      on public.newsletter_subscriptions
      for select
      to authenticated
      using (public.is_admin_user());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'post_call_zero_packets' and policyname = 'post_call_zero_admin_only_select'
  ) then
    create policy post_call_zero_admin_only_select
      on public.post_call_zero_packets
      for select
      to authenticated
      using (public.is_admin_user());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'global_market_settings' and policyname = 'global_market_admin_only_select'
  ) then
    create policy global_market_admin_only_select
      on public.global_market_settings
      for select
      to authenticated
      using (public.is_admin_user());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'global_site_settings' and policyname = 'global_site_admin_only_select'
  ) then
    create policy global_site_admin_only_select
      on public.global_site_settings
      for select
      to authenticated
      using (public.is_admin_user());
  end if;
end $$;

-- Storage notes:
-- 1. Keep bucket "post-call-zero" private and do not add public read policies.
-- 2. Keep bucket "site-assets" public only if it stores trusted images uploaded through the admin route.
-- 3. Do not create direct client write policies for private onboarding documents.
