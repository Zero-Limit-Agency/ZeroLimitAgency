# Workspace model

The shared platform exposes spaces through a future switcher rather than separate applications.

```text
Zero Limit ID (profile)
├── Personal / Coach
├── Personal / Manager-Agent
├── Creator
└── Organization membership
    ├── Team A space
    └── Team B space
```

`spaces.kind` is `personal`, `creator`, or `team`. Personal spaces have one explicit profession (`coach`, `manager_agent`, `ceo`, or `community_manager`), and no uniqueness constraint prevents one profile from owning several professions. Profession describes product context, not authority.

Creator is its own space kind with no Personal profession. This reserves a clean boundary for future creative modules without introducing portfolio, marketplace, orders, payments, or disputes.

A Team space belongs only to an `organization`; its `owner_profile_id` must be null. Organizations have members and exactly one canonical business owner in `organizations.owner_profile_id`. Membership `role` deliberately contains only `admin`/`member`, so it cannot become a second ownership source. The organization trigger creates the owner's admin membership atomically, protection triggers prevent its direct mutation/removal, and a replacement owner must already be a member. A person can join multiple organizations, and membership in one organization cannot expose another organization's record, membership, or Team space.

Modules and entitlements are intentionally future work. Profile-only scope is insufficient for Coach + Manager spaces; space-only scope is insufficient for identity-wide certification; organization-only scope is insufficient for Personal/Creator. The recommended future design is a strict multi-scope entitlement with an enum scope and a database constraint requiring exactly one of `profile_id`, `space_id`, or `organization_id`, plus a product/module key and lifecycle state. Discord access, certification, and identity-wide grants use profile scope; Personal/Creator/Team products and modules use space scope; shared Team capacity uses organization scope. Billing remains a separate source that issues entitlements server-side.

## Invitations and ownership transfer (future)

Invitations should store an organization ID, proposed non-owner role, expiry, one-time hashed random token, normalized delivery email, inviter, acceptance state, and audit references. Email transports the invitation but never becomes membership identity; acceptance under an authenticated session resolves to `profiles.id`. Profiles remain non-searchable to ordinary clients. Token comparison, expiration, role validation, consumption, and membership insertion occur in one server transaction.

Ownership transfer must be one privileged transaction: re-authenticate/confirm the current owner, authorize from `auth.uid()`, ensure or add the target membership, update `owner_profile_id`, preserve both memberships, and append an audit event. Any failure rolls back everything. Direct client RLS cannot change the owner to another profile, and protection triggers prevent partial mutation of the current owner's membership.
