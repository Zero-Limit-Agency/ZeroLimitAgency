import { NextResponse } from "next/server";
import { getClientSession } from "@/lib/auth/client-auth";
import { ensureProfileForSession, updateCurrentProfile } from "@/lib/zero-limit-id/profile";
import { validateDisplayName, validateIntent, validateLocale, validateUsername } from "@/lib/zero-limit-id/validation";

export async function POST(request) {
  const session = await getClientSession();
  if (!session?.user || session.isDemo) return NextResponse.json({ success: false, error: "Session requise." }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const username = validateUsername(body.username), display = validateDisplayName(body.displayName), locale = validateLocale(body.locale), intent = validateIntent(body.intent);
  const invalid = [username, display, locale, intent].find((item) => !item.ok);
  if (invalid) return NextResponse.json({ success: false, error: invalid.error }, { status: 400 });
  const profile = await ensureProfileForSession(session);
  const result = await updateCurrentProfile(profile, session.accessToken, { username: username.value, display_name: display.value, preferred_locale: locale.value, onboarding_intent: intent.value, onboarding_completed_at: new Date().toISOString() });
  if (!result.ok) {
    const duplicate = result.status === 409 || String(result.data?.message || "").includes("profiles_username");
    return NextResponse.json({ success: false, error: duplicate ? "Ce nom d’utilisateur est déjà utilisé." : "Impossible d’enregistrer l’onboarding." }, { status: duplicate ? 409 : 400 });
  }
  return NextResponse.json({ success: true, redirectTo: "/identite" });
}
