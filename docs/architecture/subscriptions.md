# Subscriptions and catalog

## Code-first catalog

The internal catalog lives in `lib/billing/catalog.js`. It contains stable machine keys and routing facts, not price, currency, final quota, or marketing copy. Stripe Price IDs map to plan keys through the server-only `STRIPE_PRICE_MAP_JSON`. A provider Price ID is never a product key. A database products/plans dashboard is deferred until there is an operational need.

The minimal plan contract is:

```text
Plan { key, productKey, spaceKind, personalProfession?, billingMode,
       includedSeats?, entitlementKey }
```

Current technical keys are `personal_coach`, `personal_manager_agent`, `personal_ceo`, `personal_community_manager`, `creator`, and `team`. They are not final offer names. Team `includedSeats` remains unset; the synchronized subscription `quantity` is the current allowance foundation.

## Status mapping and access policy

Local states deliberately mirror only needed Stripe states: `incomplete`, `trialing`, `active`, `past_due`, `unpaid`, `canceled`, and `paused`.

| Local status | Product access |
| --- | --- |
| `trialing` | active until period end |
| `active` | active until period end, including `cancel_at_period_end=true` |
| `canceled` | active only when a paid `current_period_end` is still in the future |
| `past_due` | suspended (conservative policy) |
| `incomplete`, `unpaid`, `paused` | inactive |

Stripe generally keeps a scheduled cancellation `active` with `cancel_at_period_end`; the canceled fallback protects already-paid time if a provider event reports it differently. At period end, reconciliation or the next provider event changes the billing entitlement to suspended/revoked. The space and its data remain unchanged.

Stripe events are triggers, not ordered subscription snapshots. After signature verification the backend retrieves the current Subscription from Stripe, then maps its Price through the server catalog. `provider_updated_at` records this retrieval timestamp, not `event.created`; a snapshot retrieved earlier cannot overwrite one retrieved later. Equal event timestamps therefore make no ordering claim. Equal retrieval timestamps may both apply, but both came from provider-authoritative reads; reconciliation converges to current provider state.

## Future server actions

Checkout, cancel, resume, plan/quantity changes, and Customer Portal sessions must validate catalog keys and quantities server-side. Portal scope will be cancellation, payment methods, invoices, and provider subscription management. No browser-supplied plan or quantity is trusted merely because it came from the UI.
