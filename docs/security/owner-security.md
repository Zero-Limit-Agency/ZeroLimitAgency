# OWNER security

OWNER uses the regular Zero Limit ID/Supabase Auth cookies only. Cookies are HttpOnly, SameSite=Lax and Secure in production. A custom cookie/header, profession, email, Organization ownership, Team membership, Discord role or browser metadata cannot grant OWNER.

## MFA and step-up target

The application does not currently consume Supabase Auth MFA assurance levels. `assuranceLevel` is therefore fail-neutral metadata, not an authorization claim. Before dangerous mutations ship, use Supabase Auth TOTP/AAL2 and add `requireOwnerStepUp`; do not build custom MFA. Production may demand more confirmation than Preview, but every environment retains the same role check. Passkeys/WebAuthn are deferred until supported by the adopted Auth flow.

## Mutation contract

Dangerous actions require: same-origin/CSRF enforcement, endpoint rate limiting, fresh AAL2, an opaque single-use intent with short expiry bound to OWNER profile + exact action + resource, explicit confirmation, and a correlation ID. Persist only a digest of the intent. Consume it atomically with the mutation and audit request, confirmation and result. Normalized errors are `owner_required`, `owner_mfa_required`, `owner_action_forbidden`, `owner_last_owner_protected`, `owner_support_context_invalid`, and `owner_confirmation_required`.

## Support, never impersonation

Future preview/support keeps the OWNER Auth identity, displays a permanent OWNER banner, binds a narrowly scoped read context, and audits opening and permitted actions. It never generates another user's session, swaps `auth.uid()`, copies cookies, creates fake Team membership, or silently bypasses RLS as that user.

Audit records now support actor auth user, actor profile, actor role, resource, action, correlation ID and sanitized metadata. Never log credentials, tokens, cookies, MFA/OAuth secrets or unnecessary PII.
