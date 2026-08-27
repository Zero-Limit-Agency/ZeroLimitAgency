# Zero Limit ID

## Contract

A Zero Limit ID represents one physical person. `profiles.id` is the stable domain identifier; `profiles.auth_user_id` is the unique link to the technical Supabase Auth user. Changes to email, password, providers, or external accounts do not change the profile ID. The profile stores only a username, display name, optional avatar URL, and an explicit `fr`/`en` preference. Locale is never inferred from country, nationality, or Discord.

Authentication methods belong to Supabase Auth. `linked_accounts` records Discord, Twitch, YouTube, Epic, or future phone identifiers separately. A `linked_accounts` row is **not proof of provider ownership** and grants no workspace, subscription, certification, Discord role, or platform authority. Authenticated clients have read-only, self-scoped RLS access. A future server-only OAuth callback must verify the provider, write/unlink the row with privileged credentials, and audit the operation; raw access/refresh tokens never belong in this table.

## Existing system

`applications` remains exclusively the historical candidature system. It is not an identity, organization, workspace, subscription, or entitlement root, and its email is not a durable business key. Existing `client_access` and `client_profiles` remain operational for legacy client spaces and can be bridged in a later, explicit migration; this foundation neither alters nor deletes them.

The existing Auth-keyed `entitlements`, training entitlements, `user_roles`, and `audit_logs` remain compatible. A later phase should decide whether entitlements migrate to `profile_id` and/or `space_id`; no silent reinterpretation occurs here.

## Lifecycle and security

An authenticated user may create/read/update only the profile whose `auth_user_id = auth.uid()`. `USING` restricts the existing row and `WITH CHECK` restricts its post-insert/post-update identity; column-level grants additionally allow updates only to `username`, `display_name`, `preferred_locale`, and `avatar_url`, making `auth_user_id` immutable through the authenticated API. Profile deletion is intentionally unavailable through RLS. Linked-account reads are self-scoped, provider identifiers are globally unique, and writes have no authenticated policy. Sensitive linking and unlinking endpoints must validate provider proofs server-side and write to `audit_logs`.

## Profile creation decision

Three viable strategies were reviewed:

| Strategy | Benefits | Failure/race behavior | Recovery, OAuth, observability and tests |
| --- | --- | --- | --- |
| Auth trigger | Atomic to the Auth transaction and covers password/OAuth uniformly. | Profile validation or trigger failure can block signup; Auth schema coupling makes failures harder to diagnose. Concurrent creation is naturally serialized by the unique FK. | Recovery generally needs privileged replay. Database logs/tests are required and product onboarding fields may not yet exist. |
| Explicit server onboarding | Clear validation, telemetry and product flow; easy unit/integration testing. | Auth may succeed while profile creation fails, leaving a recoverable incomplete account. Concurrent callbacks must handle the unique `auth_user_id` conflict idempotently. | Retry/status UI and reconciliation are straightforward; every password/OAuth entry point must call it. |
| Hybrid idempotent | A small server `ensureProfile` operation plus reconciliation handles every entry point and repairs partial states without a complex Auth trigger. | Duplicate calls race safely only when implemented as an idempotent upsert against the unique Auth FK; username conflicts require deterministic resolution. | Best recovery and observability, works with future OAuth, and supports direct integration tests plus a reconciliation metric. |

**Recommendation:** use the hybrid idempotent server approach. Keep this migration trigger-free until username/display-name rules and onboarding behavior are approved. Auth success with profile failure should produce an explicit incomplete-onboarding state, retry the same idempotency key, and be discoverable by reconciliation monitoring.

## Closure and retention (future)

Account closure must be a privileged, audited workflow, not a client cascade. It must first resolve owned organizations (transfer or close), then revoke provider links, memberships, and Personal/Creator access; decide anonymization versus deletion for the profile; preserve immutable audit/legal/contract records under an approved retention schedule; and only then delete or disable the Auth identity. Current `ON DELETE RESTRICT` from profile to Auth intentionally prevents accidental deletion in the wrong order.
