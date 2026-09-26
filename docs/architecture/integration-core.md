# Integration Core

## Doctrine and audit

Zero Limit is the only authority for profiles, organizations, memberships, spaces, entitlements, lifecycle, and platform OWNER. The browser, Discord, Google, webhooks, and provider claims are inputs—not authorization boundaries. Authentication method, `linked_accounts` identity, OAuth connection, synchronization, and webhook delivery are separate concepts.

The existing ID model already separates `profiles` (one per Auth user), organization membership, spaces, platform roles, and `linked_accounts`. Platform OWNER is deliberately unrelated to organization ownership. The new core supports **profile** and **organization** connections only; no concrete space integration requires a third scope yet.

## Existing systems

* Google Drive is a legacy, singleton admin connection in `google_oauth_tokens`. Its old migration created plaintext columns; the later encryption migration added AES-256-GCM ciphertext and the runtime clears plaintext. It requests the broad `drive` scope, uses a random state cookie, and has no PKCE. It is not migrated automatically.
* Discord in this repository is a public bot landing/configuration surface plus identity provider option in `linked_accounts`; bot implementation, guild state, roles, and operational webhooks live elsewhere. No global guild is assumed.
* Stripe stays in Billing. Its backend secret, provider signature verification, payload hashing, event inbox, retry, stale-processing reclamation, and local subscription mirror are the precedent, not tables to relocate.

## Boundaries and lifecycle

Connections are `pending`, `active`, `expired`, `revoked`, or `error`. `expired` means credentials need recovery; `revoked` is terminal until explicit reconnection; `error` is retryable/provider failure. Disconnect attempts provider revocation, erases local token ciphertext, stops sync, retains the minimal connection/audit record, and never deletes product entities or arbitrary synced business data.

Audit vocabulary: `integration_connected`, `integration_disconnected`, `integration_refresh_failed`, `integration_sync_started`, `integration_sync_succeeded`, `integration_sync_failed`, `integration_revoked`, and `integration_webhook_failed`. Metadata must never include credentials. Domain notifications may later use `integration.connected`, `integration.disconnected`, `integration.sync.completed`, and `integration.sync.failed`; no event bus is introduced.

## Provider boundaries

Discord Account, Guild, Bot, OAuth connection, Scheduled Event, and Role are distinct provider objects. Discord roles or guild membership never confer Zero Limit roles or membership. A future bot contract is backend decision → authenticated, scoped command containing an explicit guild/resource ID → bot execution → correlated result.

Google legacy admin Drive, future user OAuth, organization shared Drive, and any service account remain separate. New integrations request incremental minimum scopes; `drive.file` is registered instead of legacy full Drive access. Stripe remains Billing-only and never directly grants product authority.

Future OWNER tooling may inspect failures, reconcile, or revoke through separate platform-authority actions; OWNER is not silently treated as an organization owner.
