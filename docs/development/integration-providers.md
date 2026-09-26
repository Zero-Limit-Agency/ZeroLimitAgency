# Developing integration providers

The code-first registry declares provider key, OAuth mode, supported product scopes, supported owner scopes, webhook/refresh/revoke capability, and sync direction. Stripe intentionally is not registered: it remains a backend Billing provider.

Adapters stay small. Current mandatory capabilities are `fetchIdentity` and `sync`; add `exchangeCode`, `refresh`, `revoke`, `verifyWebhook`, or `reconcile` only when a provider needs them. Provider verification never returns Zero Limit authorization decisions.

`syncIntegration(connection, adapter)` runs only server-side for an active connection and revalidates provider, owner scope, and every granted provider scope before invoking the adapter. Default direction is read-from-provider. Writes and bidirectional conflict rules require an explicit later design; no last-write-wins, CRDT, or event sourcing is implied.

Reconciliation is controlled repair, not normal sync. Active connections may reconcile; expired connections require the explicit `restore_provider_state` purpose; error connections additionally require `recoverable=true`; pending and revoked connections are refused. `reconcileIntegration` is intended for token drift, missed notifications, and future controlled support actions.

Provider failures map to normalized `integration_*` errors. Treat 401/`invalid_grant` as expired or revoked as evidence warrants; temporary provider outages use `integration_provider_unavailable`, not revoked. Always attach a correlation ID, and redact authorization material.
