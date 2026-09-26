import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { buildAuthRedirectUrl } from "../auth/deployment-url.js";
import { IntegrationError } from "./errors.js";
import { getIntegrationProvider } from "./registry.js";

const RETURN_PATH = /^\/(?:identite|espace)(?:\/[A-Za-z0-9_-]+)*(?:\?[A-Za-z0-9._~!$&'()*+,;=:@%/?-]*)?$/;

export function normalizeIntegrationReturnPath(value, fallback = "/identite") {
  return typeof value === "string" && value.length <= 500 && RETURN_PATH.test(value) && !value.includes("//")
    ? value : fallback;
}

export function createOAuthStateSecret() { return randomBytes(32).toString("base64url"); }
export function hashOAuthState(secret) { return createHash("sha256").update(secret).digest("hex"); }

export function createOAuthStateRecord({ profileId, provider, returnPath, ttlSeconds = 600 }) {
  if (!profileId || !getIntegrationProvider(provider)) throw new IntegrationError("integration_state_invalid");
  const secret = createOAuthStateSecret();
  return {
    secret,
    record: {
      state_hash: hashOAuthState(secret), profile_id: profileId, provider,
      return_path: normalizeIntegrationReturnPath(returnPath),
      expires_at: new Date(Date.now() + Math.min(Math.max(ttlSeconds, 60), 900) * 1000).toISOString()
    }
  };
}

export function buildIntegrationCallbackUrl(provider, env = process.env, requestUrl = "") {
  if (!/^[a-z0-9_-]{2,32}$/.test(provider)) throw new IntegrationError("integration_state_invalid");
  return buildAuthRedirectUrl(`/api/integrations/${provider}/callback`, env, requestUrl);
}
