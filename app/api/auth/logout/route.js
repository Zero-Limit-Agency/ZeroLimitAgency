import { NextResponse } from "next/server";

import { clearClientAuthCookies } from "@/lib/auth/client-auth";

export const runtime = "nodejs";

export async function POST(request) {
  const response = NextResponse.redirect(new URL("/connexion", request.url));

  clearClientAuthCookies(response);
  return response;
}
