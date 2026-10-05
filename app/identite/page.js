import Link from "next/link";
import { getClientSession } from "@/lib/auth/client-auth";
import { getAuthorizedClientAccess } from "@/lib/auth/client-access";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/auth/logout-button";
import { IdentityUnavailable } from "@/components/identity/identity-unavailable";
import { identityDictionary } from "@/lib/i18n/identity";
import { reportProfileDataAccessError } from "@/lib/zero-limit-id/diagnostics";
import { AuthenticationRequiredError, ensureProfileForSession } from "@/lib/zero-limit-id/profile";

export const dynamic = "force-dynamic";

export default async function Page() {
  let profile;
  let session;
  try {
    session = await getClientSession();
    profile = await ensureProfileForSession(session);
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) redirect("/connexion");
    const correlationId = reportProfileDataAccessError(error, "/identite");
    if (correlationId) return <IdentityUnavailable correlationId={correlationId} />;
    throw error;
  }
  if (!profile.onboarding_completed_at) redirect("/identite/onboarding");
  const legacy = await getAuthorizedClientAccess(session.user);
  const t = identityDictionary(profile.preferred_locale);
  return <main className="identity-shell"><section className="identity-card"><p className="eyebrow">Zero Limit ID</p><h1>{t.accountTitle}</h1><dl className="identity-summary"><div><dt>Nom</dt><dd>{profile.display_name}</dd></div><div><dt>Username</dt><dd>@{profile.username}</dd></div><div><dt>Zero Limit ID</dt><dd><code>{profile.id}</code></dd></div><div><dt>Langue</dt><dd>{t.locale}</dd></div><div><dt>Orientation</dt><dd>{profile.onboarding_intent}</dd></div></dl><p className="identity-hint">{t.workspaceHint}</p><div className="identity-buttons"><Link className="button button-primary" href="/espace?entree=1" prefetch={false}>{t.openWorkspace}</Link><Link className="auth-inline-link" href="/espace">{t.manageSpaces}</Link>{legacy?.application_id && <Link className="auth-inline-link" href="/espace-client">{t.legacyWorkspace}</Link>}</div><LogoutButton label={t.logout}/></section></main>;
}
