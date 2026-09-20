# Billing architecture

## Existing-system audit

Zero Limit ID already separates Supabase Auth from `profiles`, models Personal/Creator spaces by `owner_profile_id`, and models Team authority with `organizations` plus canonical owner/admin membership. Personal is unique per profile/profession, Creator per profile, and Team per organization. The existing service-role-only `provision_personal_space`, `provision_creator_space`, and `provision_team` RPCs atomically create both Space and non-Billing entitlement; the application gate permits this interactive path outside production and requires `ZERO_LIMIT_INTERACTIVE_PROVISIONING=enabled` in production. Billing must not call those grant-producing RPCs before payment.

Three approaches were evaluated: (A) pre-create an unentitled Space, (B) allow a nullable subscription target and provision after provider confirmation, and (C) add a purchase-intent domain. The foundation chooses **B**: it is the smallest model, supports new and existing Spaces, and needs no speculative commercial entity. `ensure_billing_subscription_space` is a resource-only adapter over the same database uniqueness invariants; it creates no entitlement and runs only from synchronization of an access-valid provider state.

Access already flows through `zero_limit_entitlements`, whose scope is exactly one profile, space, or organization. `requireSpaceAccess` loads those grants and the module resolver applies module requirements. Entitlements have active/suspended/revoked state and validity dates. Workspace active/suspended/archived is an independent lifecycle.

`audit_logs` and hardened RPC patterns exist. The service role is server-only. No prior Stripe webhook or local subscription model existed. The old `entitlements`, `applications`, `client_access`, and `client_profiles` belong to the legacy client/application product and remain isolated; billing does not query or mutate them.

## Boundaries and truth

The required chain is **provider -> local subscription -> entitlement -> space access -> module access**.

* Stripe is authoritative for external customer, transaction, and provider-subscription state.
* `billing_accounts`, `billing_subscriptions`, and `billing_webhook_events` are the local operational mirror.
* `zero_limit_entitlements` is the only product-access authority consumed by workspace code.
* `spaces` contain product data and have an independent lifecycle. Billing never archives or deletes one.

No React component, `requireSpaceAccess`, or module resolver calls Stripe. Provider identifiers and inbox details have no browser grants. `provider` is a small replaceability seam rather than a provider framework.

## Models

`billing_accounts` represents the payer, not authority. Exactly one of `profile_id` (Personal/Creator) and `organization_id` (Team) is present. One provider customer exists per payer/provider and `(provider, provider_customer_id)` is unique. Future customer creation must happen server-side with an idempotency key based on the internal billing-account ID, then persist the result once.

`billing_subscriptions` records an explicit target kind/profession and may initially have no `target_space_id`. Once billing is access-valid, it attaches an existing validated Space or idempotently creates/reuses one from the payer scope. The record carries provider-neutral IDs, plan/entitlement keys, status, quantity, periods, cancellation state, and `provider_updated_at`; it never activates every Personal Space belonging to a profile.

All three billing tables are RLS-enabled with no `anon` or `authenticated` policies/grants. Server read models expose only product-safe fields. Future OWNER operations also remain server-side.

## Provider calls and consistency

Provider calls and PostgreSQL cannot share a transaction. Provider-facing commands will use provider idempotency keys, persist their result, and rely on signed webhook/reconciliation retry to converge. The local webhook RPC updates the subscription, synchronizes its entitlement, writes audit rows, and completes its inbox row in one database transaction.

Refunds and chargebacks are intentionally not mapped directly to destructive workspace changes. A future explicit policy will reconcile subscription state and entitlement, preserve the space, and retain financial audit evidence. Orbits require a separate purchase/ledger model and are not represented as subscriptions.
