-- Policies do not grant table privileges by themselves. Make the minimum
-- caller-owned profile access explicit instead of relying on project defaults.
grant select, insert on public.profiles to authenticated;

revoke update on public.profiles from authenticated;
grant update (
  username,
  display_name,
  preferred_locale,
  avatar_url,
  onboarding_completed_at,
  onboarding_intent
) on public.profiles to authenticated;
