export function assertIntegrationAdapter(adapter) {
  if (!adapter || typeof adapter.fetchIdentity !== "function" || typeof adapter.sync !== "function") {
    throw new TypeError("An integration adapter must implement fetchIdentity and sync");
  }
  return adapter;
}
