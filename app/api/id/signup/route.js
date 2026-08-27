import { NextResponse } from "next/server";
import { setClientAuthCookies, signUpWithPassword } from "@/lib/auth/client-auth";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { isValidEmailAddress, normalizeEmailAddress } from "@/lib/security/uploads";

export async function POST(request) {
  const limited = await checkRateLimit(request, { key: "id-signup", limit: 5, windowMs: 60000 });
  if (limited) return limited;
  const body = await request.json().catch(() => ({}));
  const email = normalizeEmailAddress(body.email || "");
  const password = String(body.password || "");
  if (!isValidEmailAddress(email) || password.length < 8 || body.acceptedTerms !== true) {
    return NextResponse.json({ success: false, error: "Vérifiez les informations et acceptez les documents requis." }, { status: 400 });
  }
  const origin = new URL(request.url).origin;
  const result = await signUpWithPassword({ email, password, emailRedirectTo: `${origin}/identite/confirmation` });
  if (!result.ok) return NextResponse.json({ success: false, error: "Impossible de créer le compte avec ces informations." }, { status: 400 });
  const response = NextResponse.json({ success: true, hasSession: Boolean(result.data?.access_token), message: result.data?.access_token ? "Compte créé." : "Consultez votre boîte email pour confirmer votre inscription." });
  if (result.data?.access_token) setClientAuthCookies(response, result.data);
  return response;
}
