import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/auth/logout-button";
import { IdentityUnavailable } from "@/components/identity/identity-unavailable";
import { identityDictionary } from "@/lib/i18n/identity";
import { reportProfileDataAccessError } from "@/lib/zero-limit-id/diagnostics";
import { AuthenticationRequiredError, ensureCurrentProfile } from "@/lib/zero-limit-id/profile";

export const dynamic = "force-dynamic";

export default async function Page() {
  let profile;
  try {
    profile = await ensureCurrentProfile();
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) redirect("/connexion");
    const correlationId = reportProfileDataAccessError(error, "/identite");
    if (correlationId) return <IdentityUnavailable correlationId={correlationId} />;
    throw error;
  }
  if (!profile.onboarding_completed_at) redirect("/identite/onboarding");
  const t = identityDictionary(profile.preferred_locale);
  return <main className="identity-shell"><section className="identity-card"><p className="eyebrow">Zero Limit ID</p><h1>{t.welcome}</h1><dl className="identity-summary"><div><dt>Nom</dt><dd>{profile.display_name}</dd></div><div><dt>Username</dt><dd>@{profile.username}</dd></div><div><dt>Zero Limit ID</dt><dd><code>{profile.id}</code></dd></div><div><dt>Langue</dt><dd>{t.locale}</dd></div><div><dt>Orientation</dt><dd>{profile.onboarding_intent}</dd></div></dl><p className="identity-hint">Votre espace métier arrive ensuite. Aucun abonnement, entitlement ou workspace n’a été créé.</p><LogoutButton label={t.logout}/></section></main>;
}
