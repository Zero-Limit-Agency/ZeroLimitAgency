# Architecture — Team membership

## Existing foundation audit

The identity foundation already provides `organizations`, `organization_memberships`, `spaces(kind = 'team')`, profiles, RLS predicates and the `protect_organization_owner_membership` trigger. Provisioning already creates one Team space, its canonical owner membership and one organization-scoped `team_access` entitlement. The space switcher requires both a membership and an active organization entitlement. Invitations already support secure creation/acceptance with hashed tokens and audit events. `PrivateShell` is the authenticated shell; platform roles and the legacy `applications/client_access` domain are separate.

This phase adds only the missing management read models and mutations. It does not replace those foundations.

## Authority and permissions

`organizations.owner_profile_id` is the only ownership authority. `organization_memberships.role` remains restricted to `admin | member`; an admin is never implicitly the owner and `platform_roles` never grants Team authority.

| Capability | Canonical owner | Admin | Member |
| --- | --- | --- | --- |
| View same-Team roster | Yes | Yes | Yes |
| View pending invitation emails | Yes | Yes | No |
| Create/resend/revoke invitations | Yes | Yes | No |
| Promote/demote a non-owner | Yes | No | No |
| Remove admin | Yes | No | No |
| Remove member | Yes | Yes | No |
| Leave Team | No (future transfer required) | Yes | Yes |

The owner is sufficient administration; a Team may have no additional admin. Ownership transfer is deliberately not implemented. The existing owner-membership trigger remains the final database guard and is not bypassed.

## Read models and isolation

`get_team_members` is executable by authenticated users and verifies same-organization membership before returning `membership_id`, `profile_id`, display name, username, Team role, canonical-owner flag and join date. It returns neither email nor `auth_user_id`.

`get_pending_team_invitations` requires owner/admin authority and returns only id, transport email, role, expiry, creation date and inviter display name. The invitation table remains non-selectable; no token hash or metadata is exposed. There is no cross-organization or global profile search.

## Mutations, concurrency and audit

All mutations are fixed-search-path `SECURITY DEFINER` RPCs, derive the actor from `auth.uid()`, revalidate organization scope, and are granted only to `authenticated`. Organization, membership or invitation rows are locked before mutation. Consequently concurrent role/remove, leave/remove, accept/revoke and accept/resend operations serialize around their authoritative row. Resend replaces the hash on the same pending invitation, so only the newest token remains valid.

Domain audit actions are `team_member_role_changed`, `team_member_removed`, `team_member_left`, `team_invitation_revoked`, and `team_invitation_resent`, alongside the existing created/accepted actions. Actors are server-derived and audit metadata never includes raw tokens, hashes, JWTs or auth payloads.

Team access remains `membership + active organization team_access`. Removing/leaving deletes the membership, naturally removing switcher/direct access even though the organization entitlement remains active.

## Future work

Ownership transfer must atomically update the canonical owner and protected owner membership in a separately reviewed design. Future organization subscriptions may compute included/extra seats from memberships, but this phase adds no seat assignment, billing dependency, Stripe integration or per-member entitlement.
