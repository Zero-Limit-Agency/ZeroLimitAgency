# Integration connections

`integration_connections` contains non-secret provider, exact owner scope (`profile` XOR `organization`), provider account/resource ID, minimal display label, status, granted scope list, and timestamps. The generic external ID is sufficient for this foundation: it denotes a user/account for Profile scope and a provider resource (for example a guild or shared Drive) for Organization scope. Provider adapters must preserve that distinction; it is not product authority. `integration_credentials` is a physically separate, service-role-only schema. Profile deletion cascades both; organization deletion does likewise, preventing orphan tokens.

Personal/Creator services are Profile-scoped. Shared guilds/Drives are Organization-scoped and require Zero Limit organization owner/admin authority. Space scope is deferred until a concrete provider requires it; provider resource IDs such as Discord guild ID belong in a future provider-resource mapping, never a global constant.

Authenticated clients cannot select or mutate either base table. Safe security-definer reads return only connection display fields. Profile owners see their connection. **All Organization members may read the safe projection; only the canonical Organization owner and explicit admins may manage or disconnect it.** Platform OWNER receives no implicit organization privilege.

Credential storage is deliberately disabled at runtime. The table shape is prepared for ciphertext and key-version metadata, but no Integration Core writer exists until audited KMS/Vault encryption is selected. Caller-supplied “ciphertext”, plaintext, Base64, and the legacy Google AES compatibility path are forbidden.

Disconnect preserves minimal metadata and audit, clears credentials, marks revoked, and stops sync. Retention target: erase token material immediately; OAuth state after 24 hours; webhook metadata after 90 days; disconnected labels/IDs after the support/legal window (default 30 days, then pseudonymize); audit according to the security retention policy. Account deletion must attempt provider revocation first, then FK cascade locally.
