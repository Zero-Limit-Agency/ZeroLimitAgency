# Workspace lifecycle architecture

## Persistence decision

Lifecycle is persisted as additive `spaces.status text not null default 'active'`, constrained to `active`, `suspended`, or `archived`. Existing rows backfill to `active`. This is necessary because lifecycle expresses the product object's availability independently of an entitlement's commercial eligibility. No `organizations.status` is added: the organization remains the durable Team/membership structure while its primary Team space owns product lifecycle.

The migration is repair-safe when replayed after a full or partial Preview application: it conditionally creates the column and indexes, restores the default/backfill/`NOT NULL` invariants, replaces functions and recreates the trigger. A same-named constraint or index with an incompatible definition causes an explicit failure instead of being silently accepted or destructively replaced.

- **active:** eligible for normal access, subject to entitlement, membership/ownership and module permission.
- **suspended:** system/OWNER/billing-reserved state; modules and active navigation are blocked, data retained, settings read-only.
- **archived:** owner-selected inactive state; modules and active navigation are blocked, data, memberships, invitations, audit and files retained.

There is intentionally no `deleted` status and no hard-delete path.

## Access matrix

| Space | Entitlement | Identity/role/module | Result |
|---|---|---|---|
| active | active and in date | allowed | normal access |
| active | suspended, revoked, absent or expired | any | denied |
| suspended | active | any | denied |
| archived | active | any | modules denied; owner can open settings to restore |

Access is the conjunction of lifecycle, entitlement, ownership/membership, and module capability. Active-space queries filter lifecycle before the switcher and module resolver. An invalid last-space cookie therefore cannot resolve and `/activer` clears it before returning to the hub, avoiding loops.

## Transitions and data safety

Owners can perform `active -> archived`. Owners can perform `archived -> active` only while the corresponding Personal/Creator space entitlement or Team organization entitlement is active and in date. No user can suspend. Suspension will be invoked later by a separately privileged system/OWNER service.

Archiving a Team does not mutate its organization, owner membership, other memberships, invitation history, entitlement, audit rows, or storage. A database trigger refuses new invitations, invitation token regeneration (resend), and pending acceptance while its Team space is inactive. Revocation remains possible.

Invitation state changes serialize against lifecycle changes by locking the Team Space row while validating `active`. Existing invitation operations lock the invitation row first and then the Team Space; lifecycle operations lock only the Team Space and never an invitation, so no reverse lock order exists. Revocation changes neither token nor acceptance and deliberately bypasses this lifecycle lock.

Future account closure must inventory owned Personal/Creator spaces, owned organizations, ordinary memberships and already archived spaces. Team closure additionally requires ownership transfer/member handling, billing termination, retention, integration teardown and storage cleanup. Future ownership transfer must reauthenticate the owner, require the target to be a member, update canonical ownership atomically, audit, and roll back on failure.

A future canceled subscription changes entitlement to suspended/revoked; it does not silently change lifecycle. A delayed archive policy may be added later. No file is deleted on archive; retention, export and cleanup remain future workflows.
