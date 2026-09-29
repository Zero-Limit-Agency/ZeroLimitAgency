import { NextResponse } from "next/server";
import { setClientAuthCookies, validateImportedClientSession } from "@/lib/auth/client-auth";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const accessToken = String(body.accessToken || "");
  const refreshToken = String(body.refreshToken || "");
  const session = await validateImportedClientSession(accessToken, refreshToken);
  if (!session) return NextResponse.json({ success: false, error: "Lien invalide ou expiré." }, { status: 400 });
  const response = NextResponse.json({ success: true });
  setClientAuthCookies(response, session);
  return response;
}
