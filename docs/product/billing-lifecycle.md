# Billing lifecycle

1. A future authenticated server flow validates a catalog plan and intended profile/organization scope.
2. It obtains or creates the single provider customer for the billing account, using provider idempotency.
3. Checkout metadata carries the internal billing account and optionally an existing Space ID; it cannot select plan, entitlement, kind or profession.
4. After a signed event, the backend retrieves current Stripe state. Only `trialing`, `active`, or paid-period `canceled` state may invoke resource-only Space provisioning. Database uniqueness reuses the exact Personal profession, Creator, or Organization Team Space without granting a free entitlement.
5. A signed provider subscription event creates/updates the local mirror transactionally.
6. Entitlement synchronization grants access. `requireSpaceAccess` continues to evaluate entitlements, never the subscription.
7. Scheduled cancellation retains access to period end. Ended, unpaid, paused, incomplete, or conservatively past-due subscriptions suspend/revoke only their billing-origin grant.

The exact future Preview journey is: sign in -> select a catalog plan and payer scope -> create/reuse the billing account (and the Organization identity for Team) -> Stripe Test Mode checkout -> signed webhook -> retrieve current Stripe Subscription -> local subscription -> create/reuse an unentitled Space only for access-valid state -> subscription entitlement -> existing access resolver. An existing Space follows the same path with its ID. No Space entitlement exists before valid billing. Production uses Live Mode. Team never silently creates a second Organization.

Customer Portal and OWNER surfaces are deferred. OWNER will eventually inspect normalized state, view failed event metadata, manually grant/suspend/revoke independent entitlements, and request reconciliation. Pricing pages, coupons, taxes, invoice UI, payouts, usage billing, AI billing, and Orbits are out of scope.

Unexpected provider/DB failures return a normalized code plus correlation ID. Public codes are `billing_not_configured`, `invalid_plan`, `subscription_not_found`, `subscription_inactive`, `provider_unavailable`, `webhook_signature_invalid`, `webhook_duplicate`, `billing_scope_mismatch`, and `seat_limit_reached`; raw Stripe errors are never returned.
