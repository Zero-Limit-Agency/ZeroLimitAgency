import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PrivateShell } from "@/components/workspace/private-shell";
import { WorkspaceSettingsForm } from "@/components/workspace/workspace-settings-form";
import { spaceDictionary } from "@/lib/i18n/spaces";
import { AuthenticationRequiredError } from "@/lib/zero-limit-id/profile";
import { getAccessibleSpacesForCurrentProfile } from "@/lib/zero-limit-id/spaces";
import { getWorkspaceSettings, WorkspaceSettingsError } from "@/lib/zero-limit-id/workspace-settings";

export const dynamic = "force-dynamic";

export default async function SettingsPage({ params }) {
  let context, space;
  try { [context, space] = await Promise.all([getAccessibleSpacesForCurrentProfile(), getWorkspaceSettings(params.spaceId)]); }
  catch (error) { if (error instanceof AuthenticationRequiredError) redirect("/identite/connexion"); if (error instanceof WorkspaceSettingsError && error.status === 404) notFound(); throw error; }
  const labels = spaceDictionary(context.profile.preferred_locale);
  return <PrivateShell {...context} currentSpace={space.status === "active" ? space : null} labels={labels}>
    <section className="workspace-settings">
      <p className="space-kind">{labels.settings.title}</p><h1>{space.name}</h1>
      <span className={`space-status ${space.status}`}>{labels.settings.statuses[space.status]}</span>
      <dl><div><dt>{labels.settings.type}</dt><dd>{labels.groups[space.kind]}</dd></div><div><dt>{labels.owner}</dt><dd>{space.owner.name}</dd></div>{space.kind === "personal" && <div><dt>{labels.settings.profession}</dt><dd>{labels.professions[space.profession]} · {labels.settings.immutable}</dd></div>}{space.kind === "team" && <><div><dt>{labels.organization}</dt><dd>{space.organization.name}</dd></div><div><dt>{labels.settings.slug}</dt><dd>{space.organization.slug}</dd></div></>}</dl>
      <WorkspaceSettingsForm space={space} labels={labels} />
      <Link className="team-back-link" href={space.status === "active" ? `/espace/${space.id}` : "/espace"}>{labels.back}</Link>
    </section>
  </PrivateShell>;
}
