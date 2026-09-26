# Developing with the OWNER guard

Use `requireOwnerSession()` only in server layouts/actions/services. API routes use `requireOwnerApiSession()` and return its response immediately when `ok` is false. Never import OWNER access code into a client component or duplicate role tests.

The guard authenticates Supabase cookies, rejects demo sessions, resolves a profile by the authenticated UUID using a server-only minimal projection, and requires exactly `platform_roles.role = 'owner'`. Infrastructure failures fail closed. The normalized result has `authUserId`, `profileId`, display fields, locale, role, grant time and a reserved assurance level.

The foundation does not write an audit row on every React render. Future operational events are `owner_session_accessed` at a meaningful session boundary, `owner_support_context_opened`, `owner_sensitive_action_requested`, `owner_sensitive_action_confirmed`, `owner_role_granted`, and `owner_role_revoked`.

Before adding a mutation: enforce same origin, apply the existing rate-limit primitive, require OWNER and step-up, validate a one-use confirmation intent, perform a server-side transaction, and record a correlation ID. Browser access to `platform_roles` is forbidden.
