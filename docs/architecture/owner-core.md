# OWNER Core

## Authority boundaries

A **user/profile** is a normal Zero Limit ID identity. A **workspace role** only authorizes actions inside a Personal, Creator or Team/Organization scope. `spaces.personal_profession = 'ceo'`, `organizations.owner_profile_id`, an `organization_memberships.role = 'admin'`, and legacy `user_roles.role = 'admin'` never imply platform authority.

**OWNER** is global platform authority, attached to an existing Zero Limit ID by the canonical `platform_roles(profile_id, role='owner')` row. It supports N owners and contains no email, name or UUID allow-list. Discord and AI are not trust boundaries.

## Foundation

`requireOwnerSession()` resolves the normal Supabase Auth session, maps `auth.users.id` to `profiles.auth_user_id`, then independently checks the server-only platform role. `/owner` is a new namespace; `/admin` remains legacy. Current OWNER has the small capability vocabulary declared in `lib/owner/capabilities.js`, without prematurely implementing RBAC.

The shell reads only a minimal profile projection. It exposes no tokens, provider payloads, billing identifiers, cookies or secrets. Billing, entitlement and workspace lifecycle remain separate domains.
