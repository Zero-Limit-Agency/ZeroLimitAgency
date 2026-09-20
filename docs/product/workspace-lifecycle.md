# Workspace lifecycle — product rules

Only active and entitled spaces appear in the normal hub and switcher. Suspended and archived spaces are never presented as usable. This phase deliberately has no large archive browser; a known settings URL remains the minimal owner restoration surface.

Archive is reversible and never deletion. It keeps business data, files, Team memberships, invitation history, audit history and entitlements. Restore never repairs or renews an expired/revoked entitlement. A suspended space is system-controlled, preserved and read-only; there is no user-facing Suspend action.

For an archived Team, members remain attached to the organization. New invitations, resend and acceptance are refused until restoration. Existing invitations may still be revoked. Members/admins can inspect Core Team identity but cannot archive, restore, rename or change the slug.

Permanent closure is out of scope. A later flow must provide retention, export, anonymization/deletion, billing and integration handling. Team deletion also needs canonical ownership transfer and member handling. No current action deletes records or files.

## Preview acceptance path

1. Sign in as a Personal owner; open an active space, then **Réglages de l’espace**; rename it and confirm profession is read-only.
2. Repeat with Creator.
3. Sign in as a Team owner; verify organization name and Team display name change together; change the lowercase slug; archive the Team.
4. Confirm the Team disappears from the hub/switcher and its normal `/espace/[id]` route is unavailable.
5. Return to the known `/espace/[id]/settings` URL; restore while entitlement remains active.
6. As Team admin/member, open settings and confirm read-only messaging and absence of mutation controls.
7. With an inactive Team fixture, verify invite creation, resend and pending acceptance are refused while memberships remain intact.
8. With suspended/expired entitlement fixtures, verify modules and active navigation remain unavailable and restore does not reactivate entitlement.
