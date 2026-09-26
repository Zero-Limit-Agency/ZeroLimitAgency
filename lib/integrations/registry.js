const definitions = Object.freeze({
  discord: Object.freeze({
    key: "discord", authMode: "oauth2", connectionScopes: ["profile", "organization"],
    supportedScopes: ["identify", "guilds"], webhookSupport: false, canRefresh: true, canRevoke: true,
    syncDirection: "read"
  }),
  google: Object.freeze({
    key: "google", authMode: "oauth2", connectionScopes: ["profile", "organization"],
    supportedScopes: ["openid", "email", "profile", "drive.file"], webhookSupport: true,
    canRefresh: true, canRevoke: true, syncDirection: "read"
  })
});

export const INTEGRATION_PROVIDERS = definitions;

export function getIntegrationProvider(key) {
  return definitions[String(key || "").toLowerCase()] || null;
}

export function assertProviderScope(provider, scopeType, scopes = []) {
  const definition = getIntegrationProvider(provider);
  if (!definition || !definition.connectionScopes.includes(scopeType)) return false;
  return scopes.every((scope) => definition.supportedScopes.includes(scope));
}
