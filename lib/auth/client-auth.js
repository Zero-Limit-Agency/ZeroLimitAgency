import "server-only";

import { cookies } from "next/headers";

import {
  createDemoClientUser,
  isDemoClientCredentials
} from "@/lib/auth/demo-client";
import { getSupabaseServerConfig } from "@/lib/supabase/server";

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

export async function getSupabaseUserFromAccessToken(accessToken) {
  return supabaseAuthRequest("/auth/v1/user", {
    accessToken
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

export async function getClientSession() {
  const cookieStore = cookies();
  const isDemo = cookieStore.get(CLIENT_DEMO_COOKIE)?.value === "1";
  const accessToken = cookieStore.get(CLIENT_ACCESS_COOKIE)?.value;

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

  if (!userResult.ok || !userResult.data) {
    return null;
  }

  return {
    accessToken,
    isDemo: false,
    user: userResult.data
  };
}
