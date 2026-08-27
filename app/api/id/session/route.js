import { NextResponse } from "next/server";
import { getSupabaseUserFromAccessToken, setClientAuthCookies } from "@/lib/auth/client-auth";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const accessToken = String(body.accessToken || "");
  const refreshToken = String(body.refreshToken || "");
  const user = await getSupabaseUserFromAccessToken(accessToken);
  if (!user.ok || !user.data?.id || !refreshToken) return NextResponse.json({ success: false, error: "Lien invalide ou expiré." }, { status: 400 });
  const response = NextResponse.json({ success: true });
  setClientAuthCookies(response, { access_token: accessToken, refresh_token: refreshToken, expires_in: Number(body.expiresIn || 3600) });
  return response;
}
