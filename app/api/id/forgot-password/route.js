import { NextResponse } from "next/server";
import { buildAuthRedirectUrl } from "@/lib/auth/deployment-url";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request) {
  const limited = await checkRateLimit(request, { key: "id-forgot", limit: 3, windowMs: 60000 });
  if (limited) return limited;
  const body = await request.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  // Keep the same response for existing and unknown accounts. Provider failures
  // are service failures, never evidence about whether this email has an account.
  if (email.includes("@")) {
    try {
      const result = await createSupabaseAdminClient().auth.sendPasswordRecovery(email, buildAuthRedirectUrl("/nouveau-mot-de-passe", process.env, request.url));
      if (!result.ok) throw new Error("Recovery provider rejected request");
    } catch {
      return NextResponse.json({ success: false, error: "Impossible d’envoyer le lien pour le moment. Réessayez dans quelques instants." }, { status: 503 });
    }
  }
  return NextResponse.json({ success: true, message: "Si un compte correspond, un email de réinitialisation a été envoyé." });
}
