import "server-only";

import { randomBytes } from "node:crypto";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const GOOGLE_OAUTH_AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_DRIVE_SCOPE = "https://www.googleapis.com/auth/drive";
const GOOGLE_DRIVE_ABOUT_URL =
  "https://www.googleapis.com/drive/v3/about?fields=user(displayName,emailAddress)";

export const GOOGLE_DRIVE_PROVIDER = "google_drive";

export function assertGoogleOAuthEnv() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI;
  const leadsRootFolderId = process.env.GOOGLE_DRIVE_LEADS_ROOT_FOLDER_ID;

  if (!clientId) {
    throw new Error("GOOGLE_OAUTH_CLIENT_ID est manquante.");
  }

  if (!clientSecret) {
    throw new Error("GOOGLE_OAUTH_CLIENT_SECRET est manquante.");
  }

  if (!redirectUri) {
    throw new Error("GOOGLE_OAUTH_REDIRECT_URI est manquante.");
  }

  if (!leadsRootFolderId) {
    throw new Error("GOOGLE_DRIVE_LEADS_ROOT_FOLDER_ID est manquante.");
  }

  return {
    clientId,
    clientSecret,
    redirectUri,
    leadsRootFolderId
  };
}

export function createGoogleOAuthState() {
  return randomBytes(24).toString("hex");
}

export function buildGoogleOAuthUrl(state) {
  const { clientId, redirectUri } = assertGoogleOAuthEnv();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    scope: GOOGLE_DRIVE_SCOPE,
    state
  });

  return `${GOOGLE_OAUTH_AUTHORIZE_URL}?${params.toString()}`;
}

export async function exchangeGoogleOAuthCode(code) {
  const { clientId, clientSecret, redirectUri } = assertGoogleOAuthEnv();
  const response = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code"
    }),
    cache: "no-store"
  });
  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.access_token) {
    throw new Error(data?.error_description || data?.error || "Impossible d'échanger le code OAuth Google.");
  }

  return data;
}

export async function refreshGoogleOAuthAccessToken(refreshToken) {
  const { clientId, clientSecret } = assertGoogleOAuthEnv();

  if (!refreshToken) {
    throw new Error("Aucun refresh token Google Drive n'est disponible.");
  }

  const response = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token"
    }),
    cache: "no-store"
  });
  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.access_token) {
    throw new Error(data?.error_description || data?.error || "Impossible de rafraîchir le token Google Drive.");
  }

  return data;
}

export async function fetchGoogleDriveProfile(accessToken) {
  const response = await fetch(GOOGLE_DRIVE_ABOUT_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    cache: "no-store"
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error?.message || "Impossible de récupérer le profil Google Drive.");
  }

  return data?.user || null;
}

function computeExpiresAt(expiresInSeconds) {
  if (!expiresInSeconds) {
    return null;
  }

  return new Date(Date.now() + Number(expiresInSeconds) * 1000).toISOString();
}

function isTokenExpired(expiresAt) {
  if (!expiresAt) {
    return true;
  }

  return new Date(expiresAt).getTime() <= Date.now() + 60_000;
}

export async function storeGoogleOAuthTokens(tokenResponse, existingToken = null) {
  const adminClient = createSupabaseAdminClient();
  const accessToken = tokenResponse.access_token;
  const refreshToken = tokenResponse.refresh_token || existingToken?.refresh_token || null;
  const profile = await fetchGoogleDriveProfile(accessToken);
  const record = {
    provider: GOOGLE_DRIVE_PROVIDER,
    google_email: profile?.emailAddress || null,
    google_display_name: profile?.displayName || null,
    access_token: accessToken,
    refresh_token: refreshToken,
    token_type: tokenResponse.token_type || existingToken?.token_type || "Bearer",
    scope: tokenResponse.scope || existingToken?.scope || GOOGLE_DRIVE_SCOPE,
    expires_at: computeExpiresAt(tokenResponse.expires_in),
    last_refreshed_at: new Date().toISOString()
  };
  const result = await adminClient.googleOAuthTokens.upsert(record);

  if (!result.ok) {
    throw new Error("Impossible d'enregistrer les tokens Google OAuth dans Supabase.");
  }

  const storedToken = Array.isArray(result.data) ? result.data[0] : result.data;

  return storedToken;
}

export async function getStoredGoogleOAuthToken() {
  const adminClient = createSupabaseAdminClient();
  const result = await adminClient.googleOAuthTokens.get(GOOGLE_DRIVE_PROVIDER);

  if (!result.ok) {
    throw new Error("Impossible de lire les tokens Google OAuth depuis Supabase.");
  }

  if (!Array.isArray(result.data) || result.data.length === 0) {
    return null;
  }

  return result.data[0];
}

export async function getValidGoogleDriveAccessToken() {
  const storedToken = await getStoredGoogleOAuthToken();

  if (!storedToken) {
    throw new Error("Google Drive n'est pas encore connecté. Lancez d'abord l'authentification OAuth.");
  }

  if (!isTokenExpired(storedToken.expires_at)) {
    return storedToken.access_token;
  }

  const refreshedToken = await refreshGoogleOAuthAccessToken(storedToken.refresh_token);
  const updatedToken = await storeGoogleOAuthTokens(refreshedToken, storedToken);

  return updatedToken.access_token;
}
