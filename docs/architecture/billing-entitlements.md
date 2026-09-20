# Billing to entitlements

`sync_subscription_entitlements(subscription_id)` is the single database synchronization operation. It locks the local subscription, validates the target kind/key, and upserts only the entitlement owned by that internal subscription.

* Personal targets exactly one Personal space and grants `personal_access`; the plan profession must have been validated before ingestion.
* Creator targets the profile's unique Creator space and grants `creator_access`.
* Team targets its Organization through the Team space and grants one organization-scoped `team_access`. It never grants once per member.

`zero_limit_entitlements.billing_subscription_id` records origin without provider secrets. Billing grants and legacy/manual grants use separate partial uniqueness rules. Therefore suspending or revoking a subscription changes only its own row: active `manual`, `promotion`, `system`, `migration`, or `purchase` access remains effective. Entitlement readers accept any active origin.

Synchronization, subscription state, inbox completion, and audit occur in the webhook RPC transaction. No entitlement operation updates `spaces.status`. Billing uses the existing Space uniqueness invariants through `ensure_billing_subscription_space`, a resource-only provisioning adapter: it never grants access itself. A valid provider state creates/reuses the exact Space and only then synchronizes the subscription-owned entitlement. Existing Spaces can be supplied explicitly and are scope-validated.

Billing may attach to an active, suspended, or archived Space, but never restores it. Space lifecycle remains a second mandatory access gate: an active subscription and entitlement on a suspended/archived Space still produce no product access until an authorized lifecycle operation restores the Space.

Minimal domain notifications for a future outbox are `billing.subscription.updated`, `billing.subscription.ended`, and `billing.entitlement.updated`. This phase records audits but deliberately does not introduce an event bus.
