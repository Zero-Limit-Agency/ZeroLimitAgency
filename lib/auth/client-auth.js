import "server-only";

import { cookies } from "next/headers";

import {
  createDemoClientUser,
  isDemoClientCredentials
} from "@/lib/auth/demo-client";
import { getSupabaseServerConfig } from "@/lib/supabase/server";
import { bindImportedSession } from "@/lib/auth/session-import";

export const CLIENT_ACCESS_COOKIE = "zla_client_access_token";
export const CLIENT_REFRESH_COOKIE = "zla_client_refresh_token";
export const CLIENT_DEMO_COOKIE = "zla_client_demo";

function buildCookieOptions(maxAgeSeconds) {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds
  };
}

async function supabaseAuthRequest(path, { method = "GET", body, accessToken } = {}) {
  const { url, anonKey } = getSupabaseServerConfig();
  const response = await fetch(`${url}${path}`, {
    method,
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken || anonKey}`,
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store"
  });
  const data = await response.json().catch(() => null);

  return {
    ok: response.ok,
    status: response.status,
    data
  };
}

export async function signInClientWithPassword({ email, password }) {
  if (isDemoClientCredentials(email, password)) {
    return {
      ok: true,
      status: 200,
      data: {
        access_token: "demo-access-token",
        refresh_token: "demo-refresh-token",
        expires_in: 60 * 60 * 24,
        user: createDemoClientUser(),
        is_demo: true
      }
    };
  }

  return supabaseAuthRequest("/auth/v1/token?grant_type=password", {
    method: "POST",
    body: { email, password }
  });
}

export async function signUpWithPassword({ email, password, emailRedirectTo }) {
  return supabaseAuthRequest(`/auth/v1/signup?redirect_to=${encodeURIComponent(emailRedirectTo)}`, {
    method: "POST",
    body: { email, password, data: {} }
  });
}

export async function updateSupabasePassword(accessToken, password) {
  return supabaseAuthRequest("/auth/v1/user", {
    method: "PUT",
    accessToken,
    body: { password }
  });
}

export async function revokeSupabaseSession(accessToken) {
  if (!accessToken) return { ok: true, status: 204, data: null };
  return supabaseAuthRequest("/auth/v1/logout", { method: "POST", accessToken });
}

export async function getSupabaseUserFromAccessToken(accessToken) {
  return supabaseAuthRequest("/auth/v1/user", {
    accessToken
  });
}

export async function refreshClientSession(refreshToken) {
  return supabaseAuthRequest("/auth/v1/token?grant_type=refresh_token", {
    method: "POST",
    body: {
      refresh_token: refreshToken
    }
  });
}

export async function validateImportedClientSession(accessToken, refreshToken) {
  // Refresh tokens are bearer credentials independent from access tokens. Rotate
  // the supplied refresh token and bind both credentials to the same canonical
  // Supabase user before any cookie is written.
  return bindImportedSession(accessToken, refreshToken, {
    getUserFromAccessToken: getSupabaseUserFromAccessToken,
    refreshSession: refreshClientSession
  });
}

export function setClientAuthCookies(response, authData) {
  const accessToken = authData?.access_token;
  const refreshToken = authData?.refresh_token;
  const expiresIn = Number(authData?.expires_in || 3600);
  const isDemo = Boolean(authData?.is_demo);

  response.cookies.set(CLIENT_DEMO_COOKIE, isDemo ? "1" : "", buildCookieOptions(isDemo ? 60 * 60 * 24 : 0));

  if (!accessToken || !refreshToken) {
    return response;
  }

  response.cookies.set(
    CLIENT_ACCESS_COOKIE,
    accessToken,
    buildCookieOptions(expiresIn)
  );
  response.cookies.set(
    CLIENT_REFRESH_COOKIE,
    refreshToken,
    buildCookieOptions(60 * 60 * 24 * 30)
  );

  return response;
}

export function clearClientAuthCookies(response) {
  response.cookies.set(CLIENT_ACCESS_COOKIE, "", buildCookieOptions(0));
  response.cookies.set(CLIENT_REFRESH_COOKIE, "", buildCookieOptions(0));
  response.cookies.set(CLIENT_DEMO_COOKIE, "", buildCookieOptions(0));

  return response;
}

function trySetCookie(cookieStore, name, value, maxAgeSeconds) {
  try {
    cookieStore.set(name, value, buildCookieOptions(maxAgeSeconds));
    return true;
  } catch {
    return false;
  }
}

function tryClearCookieStoreAuth(cookieStore) {
  trySetCookie(cookieStore, CLIENT_ACCESS_COOKIE, "", 0);
  trySetCookie(cookieStore, CLIENT_REFRESH_COOKIE, "", 0);
  trySetCookie(cookieStore, CLIENT_DEMO_COOKIE, "", 0);
}

function tryRefreshCookieStoreAuth(cookieStore, authData) {
  const accessToken = authData?.access_token;
  const refreshToken = authData?.refresh_token;
  const expiresIn = Number(authData?.expires_in || 3600);

  if (!accessToken || !refreshToken) {
    return false;
  }

  const accessSet = trySetCookie(cookieStore, CLIENT_ACCESS_COOKIE, accessToken, expiresIn);
  const refreshSet = trySetCookie(cookieStore, CLIENT_REFRESH_COOKIE, refreshToken, 60 * 60 * 24 * 30);

  return accessSet && refreshSet;
}

export async function getClientSession() {
  const cookieStore = await cookies();
  const isDemo = cookieStore.get(CLIENT_DEMO_COOKIE)?.value === "1";
  const accessToken = cookieStore.get(CLIENT_ACCESS_COOKIE)?.value;
  const refreshToken = cookieStore.get(CLIENT_REFRESH_COOKIE)?.value;

  if (isDemo) {
    return {
      accessToken: null,
      isDemo: true,
      user: createDemoClientUser()
    };
  }

  if (!accessToken) {
    return null;
  }

  const userResult = await getSupabaseUserFromAccessToken(accessToken);

  if (userResult.ok && userResult.data) {
    return {
      accessToken,
      isDemo: false,
      user: userResult.data
    };
  }

  if (!refreshToken) {
    tryClearCookieStoreAuth(cookieStore);
    return null;
  }

  const refreshedSession = await refreshClientSession(refreshToken);
  const refreshedAccessToken = refreshedSession.data?.access_token;

  if (!refreshedSession.ok || !refreshedAccessToken) {
    tryClearCookieStoreAuth(cookieStore);
    return null;
  }

  const refreshedUserResult = await getSupabaseUserFromAccessToken(refreshedAccessToken);

  if (!refreshedUserResult.ok || !refreshedUserResult.data) {
    tryClearCookieStoreAuth(cookieStore);
    return null;
  }

  tryRefreshCookieStoreAuth(cookieStore, refreshedSession.data);

  return {
    accessToken: refreshedAccessToken,
    isDemo: false,
    user: refreshedUserResult.data
  };
}
