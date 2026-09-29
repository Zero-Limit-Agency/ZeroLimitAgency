# Security pre-merge validation — 2026-09-29

## Gate status

This pass validates the remaining gates from the full review; it is not a new general audit.
There is currently no separate Supabase Preview/staging project; the dashboard contains Production
only. Production was not queried, no remote SQL was executed, and no remote migration was applied.
**Supabase runtime drift verification = NOT VERIFIED** and is classified as a
**PRE-PRODUCTION / PRE-DB-MIGRATION GATE**, not an absolute blocker for this code-only PR.
**Dependency vulnerability status = NOT VERIFIED** because the npm
advisory endpoint previously returned HTTP 403; this must be rerun in a network-enabled
pre-production environment without an automatic major upgrade.

## 1. Public contact password lifecycle

Repository-wide searches covered `password`, `temporary_password`, `temp_password`,
`mot_de_passe`, `applications`, candidature/activation code, email templates and logs.

The current contact UI does not render or append a password. `/api/contact` does not read a
`password` form part: `normalizeSignupPayload` has an explicit allow-list and therefore ignores an
old client that still sends one. Its `applications` insert has no password/metadata field, the
table migrations define no password column, Drive receives only lead identity/files, and both
Resend templates receive only the persisted application object. The route's logs contain bounded
provider errors and application IDs, not request bodies. Consequently a historically supplied
public password is neither stored, emailed, logged, copied to metadata nor retained.

Disposition: **no current finding**. A regression assertion continues to require that public
intake cannot create or confirm an Auth identity.

## 2. Legacy activation credential lifecycle

Previously the reviewed activation generated a random placeholder and submitted it once to
Supabase Auth. It was not sent by email, persisted in application/client tables, returned to an
admin, or logged, but Supabase necessarily retained its one-way Auth verifier until replacement.
Although its 256-bit entropy made reuse impractical, its validity was not locally time-bounded and
password replacement only happened when the recipient followed the recovery link.

This pass removes the placeholder entirely. Admin-reviewed activation now creates a confirmed Auth
record **without a password**, immediately sends the existing Supabase recovery email, and the
recipient sets their own password through the legacy activation page. If delivery fails, the
account has no password credential and remains inaccessible until a resend; `client_access` remains
`pending_activation`. Recovery-link lifetime, revocation and single-use semantics are controlled by
Supabase Auth deployment configuration and must be verified on a future safe staging environment
before sensitive production rollout. Admins cannot
read a plaintext password because none exists.

Disposition: prior temporary-password debt was **MEDIUM / FIX NOW** and is now eliminated locally.
The legacy recovery-link configuration is **MEDIUM / pre-production configuration gate**.

## 3. Imported session-token validation

`bindImportedSession` validates the supplied access token, rotates the supplied refresh token on
the server, validates the newly returned access token, and requires both verified users to have the
same canonical Supabase `user.id`. Only the rotated access/refresh pair is returned to the route and
written as HttpOnly cookies. Empty, invalid, incomplete, failed-refresh and mismatched-user results
all return `null`; the route returns 400 before cookie writing. Neither helper nor route logs tokens.

A behavioral negative test now supplies access token user A plus refresh token user B and asserts
rejection. This is not merely a source-pattern assertion.

## 4. CSRF mutation inventory

Every API mutation passes through middleware. Browser mutations require an `Origin`, or a
`Referer` when Origin is absent, whose origin is in deployment configuration. Accepted origins are
the canonical `NEXT_PUBLIC_APP_URL`, exact `VERCEL_URL` Preview origin, exact
`VERCEL_PROJECT_PRODUCTION_URL`, and localhost only outside production. The request Host and
`request.nextUrl.origin` are not authorities. Missing headers and external origins fail with 403.

| Routes / methods | Type and authentication | Protection / exemption |
| --- | --- | --- |
| `/api/admin/applications/**` (`POST`, `PATCH`, `DELETE`) | Cookie-authenticated legacy admin | Trusted Origin/Referer + server admin guard |
| `/api/admin/{dropmap/settings,learn-youtube/settings,maintenance,market,site-content,support-channels}` (`PATCH`) | Cookie-authenticated legacy admin | Trusted Origin/Referer + server admin guard |
| `/api/admin/formations` (`POST`) | Cookie-authenticated legacy admin | Trusted Origin/Referer + server admin guard |
| `/api/client/collaboration/[applicationId]` (`POST`), `/api/client/newsletter/[applicationId]` (`PATCH`), `/api/client/profile/avatar` (`POST`) | Cookie-authenticated client | Trusted Origin/Referer + session and application-access guard |
| `/api/id/onboarding`, `/api/spaces/**`, `/api/team/**` (`POST`) | Cookie-authenticated Zero Limit ID | Trusted Origin/Referer + canonical server/RPC authorization |
| `/api/auth/logout` (`POST`) | Cookie-authenticated | Trusted Origin/Referer; upstream revoke then cookie clear |
| `/api/auth/{login,forgot-password,password-setup}`, `/api/id/{login,signup,forgot-password,update-password,session}` (`POST`) | Public Auth flows; bearer/recovery tokens where applicable | Trusted Origin/Referer plus endpoint validation/rate limits; no exemption |
| `/api/contact` (`POST`) | Public multipart intake | Trusted Origin/Referer + upload validation/rate limit; no exemption |
| `/api/dev/auth-session-test` (`POST`) | Local-only test route | Trusted Origin/Referer and hard-disabled in production |
| `/api/billing/stripe/webhook` (`POST`) | Server-to-server webhook | **Only exemption**: Stripe signature over exact raw body; no cookie authority |

`/api/google/oauth/callback` is a provider callback but is `GET`, validates OAuth state, and is not a
mutation method for this middleware inventory. There are no other server-to-server mutation
exemptions.

## 5. Read-only catalog export

Do **not** run the tracked script merely against Production to close this PR. Retain it for a future
isolated staging/Preview project before a sensitive production release or the next DB migration.
It contains only catalog/storage `SELECT` statements and enumerates:

1. all public/storage tables plus `relrowsecurity` and `relforcerowsecurity`;
2. every policy and expression;
3. PUBLIC/anon/authenticated/service_role table, view and sequence grants;
4. every public function, exact identity signature, owner, definer flag and function config;
5. effective EXECUTE for each API role, including implicit default PUBLIC execute;
6. public/storage view definitions and security options (including `security_invoker` when set);
7. storage bucket exposure.

Public-schema functions are listed as potentially exposed PostgREST RPCs; effective EXECUTE shows
which are actually callable. A statement-level review and regression test confirm that every
statement begins with `SELECT`; there is no `CREATE`, `ALTER`, `DROP`, `GRANT`, `REVOKE`, `INSERT`,
`UPDATE`, `DELETE`, `TRUNCATE`, or `CALL`. The only selected functions are PostgreSQL catalog/ACL
introspection helpers (`pg_get_userbyid`, `aclexplode`, `acldefault`,
`pg_get_function_identity_arguments`, `pg_get_function_result`, `array_to_string`,
`has_function_privilege`, and `pg_get_viewdef`) plus scalar `coalesce`; none has side effects.

## 6. Legacy SECURITY DEFINER functions

The following expected state comes from `20260825_zero_limit_id_foundation.sql`. Actual signatures,
ACLs and config remain runtime-unverified until a safe isolated environment exists.

| Exact signature | Definer / expected path | Expected EXECUTE and use | Mutable-path scenario | Severity / gate |
| --- | --- | --- | --- | --- |
| `public.current_profile_id()` | Yes; `public` | authenticated; RLS/caller profile projection | A shadowed unqualified `auth.uid()` or built-in could run with owner rights only if an attacker can first create a searched object | MEDIUM defense-in-depth; deferred pre-production hardening |
| `public.is_organization_member(uuid)` | Yes; `public` | authenticated; RLS membership predicate | Shadowed helper/built-in could change tenant decisions; calls qualified `public.current_profile_id()` | MEDIUM defense-in-depth; same gate |
| `public.is_organization_owner(uuid)` | Yes; `public` | authenticated; RLS ownership predicate | Shadowing could change owner authorization; calls qualified helper | MEDIUM defense-in-depth; same gate |
| `public.add_organization_owner_membership()` | Yes; `public` | PUBLIC revoked; trigger only | Shadowed unqualified operators/built-ins could alter the privileged trigger insert path | LOW/MEDIUM; pre-production hardening if ACL/schema privileges match |
| `public.protect_organization_owner_membership()` | Yes; `public` | PUBLIC revoked; trigger only | Shadowing could bypass or disrupt owner membership protection | MEDIUM; pre-production hardening if ACL/schema privileges match |
| `public.require_new_organization_owner_membership()` | Yes; `public` | PUBLIC revoked; trigger only | Shadowing could weaken ownership-transfer membership invariant | MEDIUM; pre-production hardening if ACL/schema privileges match |
| `public.audit_identity_foundation_change()` | Yes; `public` | PUBLIC revoked; trigger only | Shadowed JSON/auth helper could falsify or suppress privileged audit writes | LOW/MEDIUM; pre-production hardening |
| `public.audit_organization_change()` | Yes; `public` | PUBLIC revoked; trigger only | Shadowed JSON/auth helper could falsify or suppress privileged audit writes | LOW/MEDIUM; pre-production hardening |

The proposed `pg_catalog, public` migration remains **C — DEFER INTENTIONALLY / pre-production
hardening**. Repository migrations revoke public function execution where required and do not grant
untrusted schema-object creation. Consequently no plausible HIGH exploitation path exists without
unproven runtime drift or a separately compromised privileged deployment path. The exact
`ALTER FUNCTION` migration remains review-only and must not be remotely applied in this phase.
Trigger functions are invoked by
triggers, not directly by anon/authenticated; the three predicate helpers are intentionally exposed
to authenticated for RLS and expose only caller-relative values.

## 7. Database risk assessment and merge verdict

Review of the repository migrations, security tests, expected schema, function bodies and documented
grants found no active **CRITICAL** or **HIGH** database finding whose remediation depends on a
runtime catalog check. Runtime drift is possible but unobserved; uncertainty alone is not evidence
of an exploitable deployed state. It is therefore residual risk rather than a merge blocker.

**Verdict: B — MERGE ACCEPTABLE WITH DOCUMENTED RESIDUAL RISK.** This is a security assessment,
not an instruction to merge; the Draft PR remains unmerged. The verdict is justified because the
active HIGH application findings were fixed locally, the remaining legacy `search_path` issue is
MEDIUM defense-in-depth requiring prior schema-creation privilege, and no remote DB change is part
of this PR.

Remaining human actions:

1. Establish a separate Supabase staging project in the future. Before a sensitive production
   release or the next DB migration, run the read-only export there and compare EXPECTED FROM REPO
   versus ACTUAL for RLS, policies, grants, functions, paths, views and buckets. Do not use the sole
   Production project merely to close this PR.
2. Verify Supabase recovery OTP/link expiry and one-time invalidation in that safe environment,
   including resend and failed-delivery behavior for a passwordless activated account.
3. Rerun `npm audit` with advisory network access. Status remains **NOT VERIFIED**.
4. Existing full-review residual gates remain: distributed fail-closed rate limiting, legacy Google
   OAuth isolation, managed upload scanning, deployment secret/redirect review, and AAL2 before any
   sensitive OWNER mutation.
