-- Additive product onboarding state. No workspace, entitlement or permission is created.
alter table public.profiles
  add column onboarding_completed_at timestamptz,
  add column onboarding_intent text,
  add constraint profiles_onboarding_intent_check
    check (onboarding_intent is null or onboarding_intent in ('personal', 'creator', 'team'));

revoke update on public.profiles from authenticated;
grant update (username, display_name, preferred_locale, avatar_url, onboarding_completed_at, onboarding_intent)
  on public.profiles to authenticated;
