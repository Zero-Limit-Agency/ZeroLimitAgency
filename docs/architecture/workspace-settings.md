# Workspace settings architecture

## Audit and scope decision

Before this phase, `profiles.preferred_locale` correctly held person-level preferences; `spaces` held kind, display name, immutable Personal profession and ownership scope; `organizations` held the Team name, slug and canonical owner. Memberships held only Team role, entitlements held commercial/product eligibility, and neither represented a workspace lifecycle. The module resolver composed kind, profession, entitlement and capabilities, while the switcher used that same accessible projection. Audit logging and provisioning RPCs already existed. There was no Core settings route or mutation boundary.

The scopes remain deliberately separate:

- **Profile:** person identity and locale only.
- **Space:** Personal/Creator display name, immutable Personal profession, and product lifecycle.
- **Organization:** Team name, slug and canonical owner. The primary Team space name is synchronized to the organization name and cannot diverge.

No profile profession, organization status, deletion marker, billing field or speculative setting was added.

## Server boundary and permissions

`/espace/[spaceId]/settings` is the single kind-driven route. Reads and writes call authenticated, `SECURITY DEFINER` RPCs with a hardened search path. Display names are trimmed and limited to 1–100 characters. Slugs must already be lowercase, match the existing 3–63 character rule, and remain unique. Collision becomes `slug_taken`.

`authenticated` has no direct `UPDATE` privilege on `spaces` or `organizations`, including previously granted column privileges. Existing SELECT/RLS behavior remains unchanged. All Core name, slug and lifecycle writes therefore cross `update_workspace_settings`; current application code contains no legitimate direct REST update flow for either table.

Personal and Creator owners can rename their spaces. Only the canonical `organizations.owner_profile_id` can rename a Team organization, change its slug, archive or restore its Team space. Admins and members may read Team Core settings but cannot mutate them. Personal profession is read-only; changing it requires a future dedicated migration workflow.

Audit actions are `space_renamed`, `organization_renamed`, `organization_slug_changed`, `space_archived`, and `space_restored`. The actor comes from `auth.uid()`. `space_suspended` is reserved for the future privileged system service. Existing `audit_logs` remain an audit ledger, not an event bus.

## Events and deferred work

The domain vocabulary is `space.updated`, `space.archived`, `space.restored`, and `organization.updated`. No event store/outbox exists in the current architecture, so this phase does not pretend audit rows are events. A future outbox may emit these events atomically from the same domain service.

Deferred: OWNER UI, billing, ownership transfer, public Creator profile, module-specific settings, historic slug redirects, and permanent deletion.
