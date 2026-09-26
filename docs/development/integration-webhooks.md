# Integration webhooks

## Preparatory schema only

`integration_webhook_events` is currently only a preparatory schema. There is **no endpoint, signature runtime, claim operation, retry, stale reclaim, processing worker, or provider webhook mutation path** in Integration Core. The status columns do not promise that those capabilities exist.

Before any future endpoint exists, its provider-specific implementation must verify the provider's documented signature and replay window over the **raw** request bytes before mutation. There will be no generic signature algorithm. Discord interaction signatures, Google notification validation, and future schemes require independent adapters and secrets.

The schema stores only provider/event/type IDs, optional connection ID, timestamps, attempts, normalized error code, and SHA-256 payload hash—never a raw PII payload by default. `(provider, provider_event_id)` is the future idempotency key. States are processing, processed, failed, and ignored, but duplicate handling, attempt increments, and bounded stale leases remain future work.

Delivery order will not be assumed. A future runtime should use webhook-as-signal: verify, claim an inbox row, fetch current provider state, apply an idempotent snapshot within the connection's scopes, then mark processed. It must reject invalid signatures before mutation and retry only transient failures with bounded exponential backoff. None of that processing is implemented in this phase.
