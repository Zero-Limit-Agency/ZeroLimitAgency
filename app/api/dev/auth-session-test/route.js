import { NextResponse } from "next/server";

import {
  clearClientAuthCookies,
  CLIENT_ACCESS_COOKIE,
  CLIENT_REFRESH_COOKIE
} from "@/lib/auth/client-auth";

export const runtime = "nodejs";

function buildCookieOptions(maxAgeSeconds) {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds
  };
}

function notFoundResponse() {
  return NextResponse.json(
    {
      success: false,
      error: "Introuvable."
    },
    { status: 404 }
  );
}

export async function POST(request) {
  if (process.env.NODE_ENV === "production") {
    return notFoundResponse();
  }

  const body = await request.json().catch(() => ({}));
  const action = String(body?.action || "").trim();
  const response = NextResponse.json({
    success: true,
    message: "Etat de session mis a jour pour le test local."
  });

  if (action === "invalidate-access-token") {
    response.cookies.set(
      CLIENT_ACCESS_COOKIE,
      "invalid-access-token",
      buildCookieOptions(60 * 60)
    );
    return response;
  }

  if (action === "invalidate-refresh-token") {
    response.cookies.set(
      CLIENT_REFRESH_COOKIE,
      "invalid-refresh-token",
      buildCookieOptions(60 * 60 * 24 * 30)
    );
    return response;
  }

  if (action === "clear-auth-cookies") {
    clearClientAuthCookies(response);
    return response;
  }

  return NextResponse.json(
    {
      success: false,
      error: "Action invalide."
    },
    { status: 400 }
  );
}
