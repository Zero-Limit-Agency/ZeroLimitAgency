import { NextResponse } from "next/server";

import { clearClientAuthCookies, getClientSession, revokeSupabaseSession } from "@/lib/auth/client-auth";

export const runtime = "nodejs";

export async function POST(request) {
  const session = await getClientSession();
  await revokeSupabaseSession(session?.accessToken);
  const response = NextResponse.redirect(new URL("/connexion", request.url), 303);

  clearClientAuthCookies(response);
  return response;
}
