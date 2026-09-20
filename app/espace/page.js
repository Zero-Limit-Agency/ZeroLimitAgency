import Link from "next/link";
import { redirect } from "next/navigation";
import { PrivateShell } from "@/components/workspace/private-shell";
import { spaceDictionary } from "@/lib/i18n/spaces";
import { AuthenticationRequiredError } from "@/lib/zero-limit-id/profile";
import { getAccessibleSpacesForCurrentProfile, reportSpaceDataAccessError } from "@/lib/zero-limit-id/spaces";

export const dynamic = "force-dynamic";

export default async function SpacesPage() {
  let context;
  try { context = await getAccessibleSpacesForCurrentProfile(); }
  catch (error) {
    if (error instanceof AuthenticationRequiredError) redirect("/identite/connexion");
    const correlationId = reportSpaceDataAccessError(error, "/espace");
    if (correlationId) return <main className="identity-shell"><section className="identity-card"><h1>Service indisponible</h1><p>Réessayez dans quelques instants.</p><code>{correlationId}</code></section></main>;
    throw error;
  }
  if (!context.profile.onboarding_completed_at) redirect("/identite/onboarding");
  const labels = spaceDictionary(context.profile.preferred_locale);
  const creatorExists = context.spaces.some((space) => space.kind === "creator");

  return <PrivateShell {...context} currentSpace={null} labels={labels}>
    <section className="space-selector-page">
      <p className="space-kind">Zero Limit ID</p>
      <h1>{context.spaces.length ? labels.activeSpaces : labels.emptyTitle}</h1>
      {!context.spaces.length && <p>{labels.emptyText}</p>}
      {context.spaces.length > 0 && <div className="space-grid">{context.spaces.map((space) => <Link key={space.id} href={`/espace/${encodeURIComponent(space.id)}/activer`}><strong>{space.kind === "team" ? space.organization.name : space.name}</strong><span>{space.kind === "personal" ? labels.professions[space.profession] : labels.groups[space.kind]} · {labels.alreadyActive}</span></Link>)}</div>}
      <div className="space-add-section">
        <h2>{labels.addSpace}</h2>
        <div className="space-empty-actions">
          <Link href="/espace/preparation/personal">{labels.discoverPersonal}</Link>
          {creatorExists
            ? <span className="space-option-active"><strong>{labels.discoverCreator}</strong><small>{labels.alreadyActive}</small></span>
            : <Link href="/espace/preparation/creator">{labels.discoverCreator}</Link>}
          <Link href="/espace/preparation/team">{labels.discoverTeam}</Link>
        </div>
      </div>
    </section>
  </PrivateShell>;
}
