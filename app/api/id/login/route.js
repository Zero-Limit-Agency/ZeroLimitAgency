import { NextResponse } from "next/server";
import { setClientAuthCookies, signInClientWithPassword } from "@/lib/auth/client-auth";
import { checkRateLimit } from "@/lib/security/rate-limit";

export async function POST(request) {
  const limited = await checkRateLimit(request, { key: "id-login", limit: 10, windowMs: 60000 });
  if (limited) return limited;
  const body = await request.json().catch(() => ({}));
  const result = await signInClientWithPassword({ email: String(body.email || "").trim().toLowerCase(), password: String(body.password || "") });
  if (!result.ok || !result.data?.access_token || result.data?.is_demo) return NextResponse.json({ success: false, error: "Email ou mot de passe incorrect." }, { status: 401 });
  const response = NextResponse.json({ success: true, redirectTo: "/identite" });
  setClientAuthCookies(response, result.data);
  return response;
}
