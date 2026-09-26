# Linked accounts

`linked_accounts` answers “which provider identity corresponds to this Profile?” It stores a provider user ID and display username, has uniqueness on `(provider, provider_user_id)` and `(profile_id, provider)`, and is readable only by that Profile. Browser writes are intentionally absent because provider proof is required.

It does **not** prove an active OAuth grant, contain tokens, represent authentication methods, or convey product authority. `integration_connections` answers the separate question “does Zero Limit currently hold usable provider authorization?” A connection may exist without publishing a linked identity and an identity may remain after a grant is revoked.

A personal external account can belong to only one Profile. Connecting a different account never overwrites the existing link: return `integration_account_already_linked` and require an explicit disconnect/relink confirmation flow. Organization provider resources have separate uniqueness and explicit organization authority.
