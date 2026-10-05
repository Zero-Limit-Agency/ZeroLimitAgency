import { isInteractiveProvisioningEnabled } from "@/lib/zero-limit-id/environment";
import { cookies } from "next/headers";
import { workspaceEntryDestination } from "@/lib/zero-limit-id/redirects";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PrivateShell } from "@/components/workspace/private-shell";
import { PageHeader } from "@/components/workspace/page-header";
import { spaceDictionary } from "@/lib/i18n/spaces";
import { AuthenticationRequiredError } from "@/lib/zero-limit-id/profile";
import { getAccessibleSpacesForCurrentProfile, reportSpaceDataAccessError } from "@/lib/zero-limit-id/spaces";

export const dynamic = "force-dynamic";

export default async function SpacesPage({ searchParams }) {
  let context;
  try { context = await getAccessibleSpacesForCurrentProfile(); }
  catch (error) {
    if (error instanceof AuthenticationRequiredError) redirect("/connexion");
    const correlationId = reportSpaceDataAccessError(error, "/espace");
    if (correlationId) return <main className="identity-shell"><section className="identity-card"><h1>Service indisponible</h1><p>Réessayez dans quelques instants.</p><code>{correlationId}</code></section></main>;
    throw error;
  }
  if (!context.profile.onboarding_completed_at) redirect("/identite/onboarding");
  if (searchParams?.entree === "1") {
    const destination = workspaceEntryDestination(context.spaces, cookies().get("zla_last_space")?.value);
    if (destination) redirect(destination);
  }
  const labels = spaceDictionary(context.profile.preferred_locale);
  const creatorExists = context.spaces.some((space) => space.kind === "creator");

  return <PrivateShell {...context} currentSpace={null} labels={labels}>
    <section className="space-selector-page">
      <PageHeader eyebrow="Zero Limit ID" title={context.spaces.length ? labels.activeSpaces : labels.emptyTitle} description={!context.spaces.length ? labels.emptyText : undefined} />
      {context.spaces.length > 0 && <div className="space-grid">{context.spaces.map((space) => <Link prefetch={false} key={space.id} href={`/espace/${encodeURIComponent(space.id)}/activer`}>
        <span className={`space-card-icon ${space.kind}`} aria-hidden="true">{space.kind === "team" ? "T" : space.kind === "creator" ? "C" : "P"}</span>
        <span className="space-card-copy"><small>{labels.groups[space.kind]}</small><strong>{space.kind === "team" ? space.organization.name : space.name}</strong>{space.kind === "personal" && <span>{labels.professions[space.profession]}</span>}</span>
        <span className="space-card-status"><i aria-hidden="true" />{labels.alreadyActive}</span>
      </Link>)}</div>}
      {!isInteractiveProvisioningEnabled() && <p className="identity-hint" role="status">{labels.provisioningUnavailable}</p>}
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
