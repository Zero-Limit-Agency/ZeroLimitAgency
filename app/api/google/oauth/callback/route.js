import { NextResponse } from "next/server";

import {
  exchangeGoogleOAuthCode,
  getStoredGoogleOAuthToken,
  storeGoogleOAuthTokens
} from "@/lib/google/oauth";

export const runtime = "nodejs";

const OAUTH_STATE_COOKIE = "google_oauth_state";
const OAUTH_NEXT_COOKIE = "google_oauth_next";

function clearOAuthCookies(response) {
  response.cookies.set(OAUTH_STATE_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
  response.cookies.set(OAUTH_NEXT_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
}

function buildRedirectUrl(requestUrl, pathname, searchParams = {}) {
  const baseUrl = new URL(requestUrl);
  const target = new URL(pathname, baseUrl.origin);

  Object.entries(searchParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      target.searchParams.set(key, value);
    }
  });

  return target;
}

export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const googleError = url.searchParams.get("error");
  const expectedState = request.cookies.get(OAUTH_STATE_COOKIE)?.value;
  const nextPath = request.cookies.get(OAUTH_NEXT_COOKIE)?.value || "/connexion";

  if (googleError) {
    const response = NextResponse.redirect(
      buildRedirectUrl(request.url, nextPath, {
        google: "error",
        reason: googleError
      })
    );

    clearOAuthCookies(response);
    return response;
  }

  if (!code || !state || !expectedState || state !== expectedState) {
    const response = NextResponse.redirect(
      buildRedirectUrl(request.url, nextPath, {
        google: "error",
        reason: "invalid_state"
      })
    );

    clearOAuthCookies(response);
    return response;
  }

  try {
    const existingToken = await getStoredGoogleOAuthToken();
    const tokenResponse = await exchangeGoogleOAuthCode(code);
    const storedToken = await storeGoogleOAuthTokens(tokenResponse, existingToken);
    const response = NextResponse.redirect(
      buildRedirectUrl(request.url, nextPath, {
        google: "connected",
        email: storedToken?.google_email || undefined
      })
    );

    clearOAuthCookies(response);
    return response;
  } catch (error) {
    const response = NextResponse.redirect(
      buildRedirectUrl(request.url, nextPath, {
        google: "error",
        reason: error instanceof Error ? error.message : "oauth_failed"
      })
    );

    clearOAuthCookies(response);
    return response;
  }
}
