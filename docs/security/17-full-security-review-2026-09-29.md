# Full security review — 2026-09-29

## Executive summary

This review covered the tracked Next.js application, API route handlers, server libraries,
Supabase migrations and database tests at commit `ef16113`. It did not inspect or change the
separate Discord bot, any deployed Supabase project, Vercel settings, Stripe dashboard, Google
Cloud project, Resend account, or secrets/history outside this checkout.

No critical issue was found. Two high-impact authentication issues and two medium issues are
fixed locally. The principal pre-production residual risks are the legacy Google Drive OAuth
connection, the non-distributed fallback rate limiter, broad historical Drive scope, and the fact
that database posture could only be reviewed from migrations rather than verified against the
deployed catalog. No remote migration was applied.

## Attack-surface map

| Surface | Entry points | Final authority / sensitive data | Review result |
| --- | --- | --- | --- |
| Public identity | `/connexion`, `/inscription`, password reset, confirmation, `/api/id/*`, legacy `/api/auth/*` | Supabase Auth and server-set HttpOnly cookies | Token-pair confusion fixed; redirects are allow-listed/canonicalized |
| Legacy application intake | `/api/contact` with multipart uploads | service role, Auth admin API, applications, Google Drive | Premature confirmed-account creation removed; upload size/type/signature bounds exist |
| Legacy admin/client | `/admin`, `/espace-client`, `/api/admin/*`, `/api/client/*` | canonical `user_roles` / `client_access` server lookups | Kept deliberately separate from platform OWNER; legacy admin remains a distinct authority |
| Zero Limit ID/workspaces | `/identite`, `/espace`, team and settings APIs | `profiles`, organizations, memberships, spaces, entitlements and RLS/RPCs | Caller identity is derived from `auth.uid()`; owner/member invariants are DB-backed |
| Platform OWNER | `/owner`, `platform_roles` | server-side owner lookup; service-role-only writes | Sole authority is `platform_roles`; last-owner trigger exists; AAL2 is deferred until mutations exist |
| Billing | Stripe webhook | Stripe signature + provider re-fetch + service-role-only RPCs | Replay and stale snapshot handling exist; provider price map is canonical |
| Integration core | server libraries and DB RPCs (no provider routes yet) | scoped connections; credentials/state/webhook tables | Credential writes remain fail-closed until KMS/Vault exists |
| Legacy Google OAuth | `/api/google/oauth/{start,callback}` and contact uploads | singleton Drive token record, service role, AES-GCM application key | Isolated but intentionally deferred; broad Drive scope/no PKCE/plaintext fallback remain |
| Email | Supabase Auth mail + Resend | configured canonical origin and server-only keys | No request Host trust in production/preview; generic modern reset response |
| Static/browser | Next pages/components/assets | CSP and security headers | Baseline headers exist; CSP still permits inline scripts/styles for Next compatibility |

## Findings and disposition (recorded before code changes)

| ID | Finding | Severity | Class | Exploit scenario | Affected files | Fix now? | Reason |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AUTH-01 | Confirmation session accepted an independently supplied access token and refresh token without proving they represented the same user. | HIGH | A — FIX NOW | A crafted/mixed callback could install user A's short-lived access token with user B's refresh token; after refresh the cookie session silently changes identity. | `app/api/id/session/route.js`, `lib/auth/client-auth.js` | Yes | Authentication continuity must be server-validated. |
| AUTH-02 | Public application intake created an email-confirmed Supabase user with a caller-selected password before review. | HIGH | A — FIX NOW | An attacker submits a victim's email first; later activation reuses that Auth identity, creating account-preemption and stale-session risk. | `app/api/contact/route.js`, `lib/auth/client-activation.js` | Yes | Public intake must not assert email ownership or create a privileged identity. |
| AUTH-03 | Legacy activation generated an administrative placeholder password with `Math.random()`. | MEDIUM | A — FIX NOW | The credential had weak entropy and an unnecessary validity lifecycle. | `lib/auth/client-activation.js` | Yes | Passwordless user creation followed by the existing recovery flow removes the placeholder entirely. |
| CSRF-01 | Same-origin middleware treated a missing `Origin` as trusted for every mutating API request. | MEDIUM | A — FIX NOW | Cross-site navigations/forms can omit `Origin`; cookie-authenticated form-compatible mutations could bypass the intended CSRF gate. | `middleware.js` | Yes | Require either same-origin `Origin` or same-origin `Referer`, while allowing non-cookie webhook traffic. |
| OAUTH-01 | Legacy Google OAuth has broad full-Drive scope, no PKCE, a singleton admin connection and encrypted columns with plaintext read fallback. | HIGH | C — DEFER INTENTIONALLY | Theft/misuse of the singleton credential exposes all Drive resources granted to the connected account; legacy plaintext rows remain readable by server code. | `lib/google/oauth.js`, `lib/security/oauth-token-encryption.js`, Google token migrations | No | A safe change needs Google consent/scope redesign and an operator-controlled data migration. Keep admin-only isolation; do not merge into Integration Core automatically. |
| RATE-01 | The default/local limiter is per-instance memory and falls back open to local memory if Redis fails. | MEDIUM | B — BLOCK / FAIL CLOSED UNTIL LATER | Distributed/serverless requests can evade per-instance counters and email/contact abuse controls. | `lib/security/rate-limit.js`, `.env.example` | No code change | Production must set Redis and `RATE_LIMIT_FAIL_CLOSED=true`; deployment configuration is outside this repo. |
| DB-01 | **Supabase runtime drift verification = NOT VERIFIED.** Repository review cannot prove the sole Production database matches migrations. | INFO (residual uncertainty, not evidence of an active vulnerability) | C — PRE-PRODUCTION / PRE-DB-MIGRATION GATE | A skipped migration or manual grant could expose data, but no runtime drift has been observed because Production was deliberately not queried. | `scripts/security/verify-supabase-security.sql`, all migrations | No remote action | There is no separate Preview/staging project. Do not query Production merely to close this PR; verify on a future isolated environment before sensitive production work or the next DB migration. |
| DB-02 | Early identity SECURITY DEFINER helpers use `search_path = public`, rather than the hardened `pg_catalog, public` form used by later RPCs. | MEDIUM | C — DEFER INTENTIONALLY | Exploitation requires an untrusted actor first gaining object-creation rights in a searched schema; repository migrations do not grant those rights. | `20260825_zero_limit_id_foundation.sql` | No | Defense-in-depth hardening for the next reviewed DB migration; exact SQL remains proposed and unapplied. |
| PRIV-01 | Legacy admin (`user_roles.admin`) and platform OWNER (`platform_roles.platform_owner`) are separate but coexist. | INFO | C — DEFER INTENTIONALLY | Operational confusion could lead staff to assume OWNER implies Team/admin access. | admin/owner guards and role migrations | No | Separation is intentional; do not silently migrate authority. |
| OWNER-01 | OWNER has read-only shell today and no dangerous mutation endpoint; AAL2 is absent. | INFO | C — DEFER INTENTIONALLY | Future role, billing, credential, impersonation or destructive mutations would be dangerous at AAL1. | `app/owner/*`, `lib/owner/*` | No | Require AAL2 immediately before adding OWNER grant/revoke, impersonation, billing override, credential or destructive actions. |
| CSP-01 | CSP permits inline scripts and styles. | LOW | C — DEFER INTENTIONALLY | A separate injection bug has fewer CSP barriers. | `lib/security/headers.mjs` | No | Next-compatible nonce/hash rollout needs report-only telemetry first; an untested breaking CSP is worse. |
| UPLOAD-01 | ZIP/PDF/image uploads are signature/size bounded but not malware scanned before Drive storage. | MEDIUM | C — DEFER INTENTIONALLY | A malicious but structurally valid document can reach operators through Drive. | `app/api/contact/route.js`, `lib/security/uploads.js` | No | Add a managed scanning/quarantine workflow only if intake remains enabled; do not build a custom scanner. |
| PRIV-02 | Contact success returns the internal application UUID and email delivery diagnostics. | LOW | C — DEFER INTENTIONALLY | An untrusted submitter learns an internal identifier and operational mail status unnecessarily. | `app/api/contact/route.js` | No | Not an authorization token; remove in the next API compatibility revision. |
| LOG-01 | Several server logs retain provider/upstream messages (not tokens) and application UUIDs. | LOW | C — DEFER INTENTIONALLY | Provider text may include excess PII or implementation detail in centralized logs. | contact/auth/admin route logs | No | Adopt structured allow-listed error categories and retention controls centrally. |

## RLS and SECURITY DEFINER review

Sensitive tables found: `applications`, `client_access`, `client_profiles`, `user_roles`,
`newsletter_subscriptions`, collaboration/call/packet tables, Google tokens, global settings,
training catalog/progress/notes/comments/entitlements, `profiles`, `linked_accounts`,
`organizations`, `organization_memberships`, `spaces`, `platform_roles`,
`zero_limit_entitlements`, `organization_invitations`, billing tables, integration tables, and
`audit_logs`. Their creating/hardening migrations enable RLS. Billing and Integration Core tables
explicitly revoke `public`, `anon`, and `authenticated`, granting the service role. Historical
tables are protected by the 2026-07-03 policy migration. No `USING (true)` policy was found.

All reviewed callable privileged RPCs either derive identity through `auth.uid()` and
`current_profile_id()` or explicitly require `auth.role() = 'service_role'`. Team invitation
acceptance binds the authenticated, verified email to the stored recipient, uses a server-generated
random token stored as SHA-256, checks expiry/revocation/use state, and updates under row locks.
Team owner membership and platform last-owner protection are database triggers. Later RPCs use
`search_path = pg_catalog, public` and revoke PUBLIC execution; early helpers need the proposed
hardening migration below. No dynamic SQL using user parameters was found in callable RPCs.

## Applied local fixes

1. Bind imported access/refresh tokens by refreshing server-side and requiring equal canonical
   Supabase user IDs; install only the rotated session returned by Supabase.
2. Stop `/api/contact` from creating an email-confirmed Auth user. Identity creation remains an
   admin-reviewed activation action, and email proof occurs through the recovery link.
3. Remove activation placeholder passwords; activation creates no reusable password and sends the
   existing Supabase recovery flow so the recipient chooses the first credential.
4. Tighten CSRF checks for browser API mutations: missing `Origin` now needs a valid `Referer`, and
   the source must match deployment-configured canonical/Preview origins rather than request Host;
   Stripe's signed webhook remains exempt from browser-origin enforcement.

## Proposed SQL migration — review only, not applied

After a future isolated catalog verification confirms these functions exist with the expected signatures, use
the following migration. It changes configuration only and does not alter data:

```sql
begin;
alter function public.current_profile_id() set search_path = pg_catalog, public;
alter function public.is_organization_member(uuid) set search_path = pg_catalog, public;
alter function public.is_organization_owner(uuid) set search_path = pg_catalog, public;
alter function public.add_organization_owner_membership() set search_path = pg_catalog, public;
alter function public.protect_organization_owner_membership() set search_path = pg_catalog, public;
alter function public.require_new_organization_owner_membership() set search_path = pg_catalog, public;
alter function public.audit_identity_foundation_change() set search_path = pg_catalog, public;
alter function public.audit_organization_change() set search_path = pg_catalog, public;
commit;
```

## Areas checked without a confirmed exploitable finding

- Redirects use a strict internal allow-list and trusted configured/Vercel origins; legacy auth
  aliases filter query parameters. No open redirect was reproduced.
- Auth cookies are HttpOnly, Secure in production, SameSite=Lax, scoped to `/`, and cleared on
  logout. Supabase validates access tokens server-side and refreshes are rotated.
- Profiles are bound to `auth.uid()`; browser-supplied profile IDs are not accepted. Linked account
  provider IDs are unique, read-only to users, and no linking mutation route exists.
- Workspace access resolves active spaces and canonical entitlements server-side. Archived spaces
  fail closed. Team roles cannot represent owner; owner identity is canonical on organizations.
- Stripe signatures are verified over the raw body with timestamp tolerance and constant-time
  comparison. The handler re-fetches subscriptions from Stripe, maps server-configured prices,
  rejects scope/account mismatches, deduplicates event IDs, and ignores older snapshots.
- Integration credential writes deliberately return 501. Connections are caller-scoped by RPC;
  credentials, OAuth states and webhook inboxes are service-role-only.
- Discord values in this repo are presentation/configuration only. No Discord role, guild ID or
  external username is used as product authority, and no Discord callback/webhook exists here.
- No permissive CORS response headers were found. Private APIs are no-store; server fetches use
  `cache: 'no-store'`. No service-role module is imported by a client component.
- No `dangerouslySetInnerHTML`, shell execution, user-controlled filesystem path, raw SQL built
  from request data, or unescaped markdown renderer was found.
- No tracked secret value was found; `.env.example` contains empty/placeholders and documents
  server-only encryption configuration. Repository history/secret scanning remains a platform task.
- Error responses generally map upstream/database errors to stable messages/codes; raw provider
  errors are retained only in some server logs.

## Residual risk and pre-production gates

1. **Supabase runtime drift verification = NOT VERIFIED.** No separate Preview/staging database
   exists and Production was not queried. Create a proper isolated staging project in the future,
   then run `scripts/security/verify-supabase-security.sql` there before sensitive production work
   or the next database migration. Apply the proposed function configuration only after review.
2. Configure distributed Redis rate limiting with fail-closed behavior and test outage behavior.
3. Keep legacy Google OAuth disabled unless operationally required. If required, use a dedicated
   least-privilege Drive account/folder, verify all plaintext token columns are null, rotate the
   encryption key under a documented re-encryption procedure, and schedule PKCE/scope reduction.
4. Add managed malware scanning/quarantine before staff open public uploads.
5. Verify Vercel environment separation, Supabase redirect allow-lists, Stripe endpoint secret,
   Google redirect URI, Resend sender/domain and log retention outside the repository.
6. Add AAL2 as a mandatory server guard before the first sensitive OWNER mutation. Do not treat
   OWNER, Discord roles or legacy admin as implicit Team authority.
7. Run DAST against a future isolated staging environment and dependency/secret scanning in CI; this static review is not a
   substitute for deployed configuration verification or penetration testing.
