# Stripe webhook operations

## Endpoint and events

Configure Stripe to send to `POST /api/billing/stripe/webhook`. The route reads `request.text()` before parsing and requires a valid `Stripe-Signature` HMAC-SHA256 (`v1`) within five minutes. Unsigned or stale requests are rejected.

Handled state-changing events are `customer.subscription.created`, `.updated`, and `.deleted`. Each is only a trigger: the backend retrieves current provider state before normalization, so equal-second and out-of-order event payloads never pretend to be ordered versions. `invoice.paid`, `invoice.payment_failed`, and unknown events are stored as ignored without access mutation. Checkout completion is deferred.

The inbox stores provider/event/object IDs, type, SHA-256 payload hash, timestamps, state, attempts, and a normalized error code—not raw payload or PII. The RPC claims a row, runs mutations in a PL/pgSQL exception subtransaction, and persists `processed` or `failed`. Processed/ignored duplicates are acknowledged; failed rows retry with an incremented attempt; a processing claim older than five minutes is reclaimed. A current processing claim is not run concurrently. Business mutations roll back on failure while the failed inbox record commits.

HTTP policy is explicit: `processed`, `duplicate`, `ignored`, and permanent `failed` results return 200; a current `processing` claim and transient `failed` result return 503 so Stripe retries. `invalid_plan`, `billing_scope_mismatch`, and local constraint/data mismatch are permanent: they remain visible as failed for reconciliation/support but are acknowledged to prevent an infinite provider retry loop. Provider/API unavailability, Supabase transport/database failure, and unexpected internal processing failure are transient. A valid-signature provider fetch failure is recorded with a safe code when possible, then returns 503. Invalid signatures return 400 before any inbox call.

## Environment separation

Required server-only Vercel variables:

```text
STRIPE_SECRET_KEY=sk_test_...       # sk_live_... only in Production
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_MAP_JSON={"price_...":"personal_coach"}
```

Development and Preview must use Test Mode; Vercel Production must use Live Mode. Runtime guards reject a live key outside production and a test key in production. Each environment needs its own webhook secret and matching Test/Live Price IDs. Never prefix these variables with `NEXT_PUBLIC_`, reuse production secrets in Preview, commit `.env.local`, call Stripe Live in tests, or expose the Supabase service role.

Tests use signed fixtures/mocks. Stripe CLI is useful for manual forwarding but not required. Operational retry is safe because the provider event ID is idempotent and subscription mutation is monotonic. Raw payload retention is intentionally zero; if temporary incident retention is ever introduced it needs explicit PII review and deletion policy.
