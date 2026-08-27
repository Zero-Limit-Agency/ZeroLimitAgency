# Permissions model

## Separate dimensions

- **Persona/profession** answers which Personal product context is active; it grants no sensitive permission.
- **Organization membership role** (`admin`, `member`) is scoped to exactly one customer organization. Ownership comes only from `organizations.owner_profile_id`.
- **Platform authority** (`platform_owner`) is stored in the isolated `platform_roles` table and is service-role managed. It is not inferred from a profession, Team membership, Discord, or the legacy `user_roles` table.
- **Entitlements** will answer which modules/products a subject may use; their profile/space scope must be decided later.

Organization owner (a client CEO) is therefore never Zero Limit platform OWNER. Owning an organization can manage that organization's non-owner memberships and Team spaces only. It cannot read `platform_roles`, and no authenticated RLS policy exists on that table. Ownership transfer requires a future audited server operation rather than a client-side row update.

## RLS boundary

Profiles and linked accounts are self-only. Organizations, memberships, and Team spaces require membership in that exact organization. Organization management requires exact ownership. Personal and Creator spaces require exact profile ownership. Security-definer predicates use a fixed `search_path` and derive the profile from `auth.uid()`; no frontend-provided user ID is trusted.

Service-role use stays server-side and is never bundled into browser code. It is reserved for provider-verified linking, invitation acceptance where a profile cannot be exposed, transactional ownership transfer, platform-role assignment, and entitlement issuance. Ordinary self/member access continues through RLS rather than treating service role as a general authorization shortcut. Future sensitive operations must validate authority from the server's authenticated session and append an audit event. A generic `authenticated = full access` policy is prohibited.

A future `isPlatformOwner(auth.uid())` check should be a server-only repository/helper querying `platform_roles` with the server credential after validating the session. It must accept the verified session user, resolve its profile internally, return only a boolean, and never expose the table or service credential to the browser.

## SECURITY DEFINER review

`current_profile_id`, `is_organization_member`, and `is_organization_owner` exist only to derive predicates from `auth.uid()` while avoiding recursive membership RLS. They use a fixed `search_path`, return only UUID/self-scoped booleans, and cannot inspect an arbitrary user. Trigger helpers atomically create/protect owner membership and write minimal audit records. Trigger-function execution is revoked from `public`; only the three narrow predicate helpers are executable by `authenticated`. None grants platform authority or returns membership data.

Audit triggers cover organization changes, membership changes, platform-role changes, and linked-account link/unlink changes. Actor identity is derived from `auth.uid()` (or records the database role for privileged maintenance), target comes from the affected row, timestamp comes from `audit_logs`, and metadata contains only organization identifiers. OAuth tokens, secrets, passwords, profile attributes, and provider identifiers are not logged. A future ownership-transfer function should emit a specific transfer event in the same transaction.
