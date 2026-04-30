import { NextResponse } from "next/server";

import { buildGoogleOAuthUrl, createGoogleOAuthState } from "@/lib/google/oauth";
import { requireAdminApiSession } from "@/lib/auth/api-guards";

export const runtime = "nodejs";

const OAUTH_STATE_COOKIE = "google_oauth_state";
const OAUTH_NEXT_COOKIE = "google_oauth_next";

function buildCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10
  };
}

export async function GET(request) {
  const adminAccess = await requireAdminApiSession();

  if (!adminAccess.ok) {
    return adminAccess.response;
  }

  const url = new URL(request.url);
  const nextPath = url.searchParams.get("next");
  const safeNextPath = nextPath && nextPath.startsWith("/admin") ? nextPath : "/admin";
  const state = createGoogleOAuthState();
  const redirectUrl = buildGoogleOAuthUrl(state);
  const response = NextResponse.redirect(redirectUrl);

  response.cookies.set(OAUTH_STATE_COOKIE, state, buildCookieOptions());
  response.cookies.set(OAUTH_NEXT_COOKIE, safeNextPath, buildCookieOptions());

  return response;
}
