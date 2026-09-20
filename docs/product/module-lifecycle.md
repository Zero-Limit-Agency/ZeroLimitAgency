# Module lifecycle

A module may be unavailable (incompatible), disabled (release or scope activation), or enabled. Accessible is a user-specific authorization result, not a persisted lifecycle state. `coming_soon` is discoverability metadata only and never grants access; current navigation exposes accessible modules only.

Disabling a module stops entry but does not delete or migrate its records. Re-enabling should restore access subject to current authorization. Every future module must define retention, export, archive, deletion and ownership behavior before release.

Domain events such as `space.created`, `space.updated`, `member.added`, `member.removed`, and `module.enabled` use stable past-tense names and a versioned payload/envelope. They are integration facts for future notifications, analytics, desktop sync, Discord or AI consumers. They contain minimal identifiers and no secrets. No event bus is introduced now.

Audit logs are immutable security/administrative evidence: actor, action, resource and time. Domain events request downstream reactions and may be retried. Audit logs must never become an event bus, and successful event delivery must never determine whether an auditable action is recorded.
