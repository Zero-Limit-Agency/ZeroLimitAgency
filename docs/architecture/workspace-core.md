# Workspace Core

## Existing-system audit (20 September 2026)

The current Zero Limit ID is rooted in Supabase Auth and `profiles`; onboarding creates the profile independently of legacy applications. A profile owns Personal/Creator spaces, while a Team space belongs to an organization. `spaces.personal_profession` is the only profession source (`coach`, `manager_agent`, `ceo`, `community_manager`); profession must never move to `profiles`.

The common core already includes typed spaces, server-side space resolution, scoped `zero_limit_entitlements`, RLS/RPC provisioning, audit logging, i18n, no-store Supabase requests, safe error correlation, the space switcher and last-active-space cookie. Personal and Creator are single-owner cores. Team adds canonical organization ownership, admin/member memberships, invitations and member management. Organization ownership is **not** a membership role: the owner has an `admin` membership but authority comes from `organizations.owner_profile_id`.

`applications`, `client_access`, `client_profiles` and the older `entitlements` table are legacy client/training systems. They remain isolated and are not inputs to workspace/module authorization. Existing storage supports avatars, application uploads and training assets; it is not a workspace document system.

The missing layer was a module contract, compatibility/activation/access distinction, reusable capabilities, module authorization service and shell navigation input. This phase supplies those pieces without a business module or schema change.

## Final core boundary

Every space core owns identity, access, capabilities, minimal settings, product entitlements, audit, lifecycle interpretation and module resolution. It knows module metadata but never module internals.

- **Personal:** unique profile owner, `personal_profession`, `personal_access`, name, module resolution and audit. The owner has core control.
- **Creator:** unique profile owner, `creator_access`, name, module resolution and audit. The owner has core control; future collaborators are not precluded, but are not modeled.
- **Team:** organization, canonical owner, admin/member memberships, invitations, `team_access`, organization/space names, capabilities, module resolution and audit. Membership and permissions are core, not modules.

## Settings and lifecycle

Keep validated first-class columns: `spaces.name`, `organizations.name`, `organizations.slug`, and `profiles.preferred_locale`. Do not add speculative timezone fields, a free-form JSON bag, or `space_settings` until a concrete cross-module setting exists. Future typed settings may use additive columns or a narrow validated table.

Existing entitlement/membership revocation makes a space inaccessible. Future `active`, `suspended`, `archived`, and `closed` states are documented but deliberately not persisted yet. Closing or disabling never implies immediate data deletion.

## Service, cache, and clients

UI calls server services: `requireSpaceAccess`, entitlement services, membership services, module resolution and permission helpers. Decisions do not live in React, browser state, local storage, Discord, or AI integrations. Auth-dependent fetches use `cache: "no-store"`; do not put resolved access in a global cache. Re-resolve after entitlement, membership, ownership, or activation changes.

Pure registry/resolver contracts can be shared by a future desktop client, but an authenticated server/API remains the authority. Web and desktop are presentation clients, never trust boundaries.
