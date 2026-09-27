import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PrivateShell } from "@/components/workspace/private-shell";
import { WorkspaceSettingsForm } from "@/components/workspace/workspace-settings-form";
import { PageHeader, StatusBadge } from "@/components/workspace/page-header";
import { spaceDictionary } from "@/lib/i18n/spaces";
import { AuthenticationRequiredError } from "@/lib/zero-limit-id/profile";
import { getAccessibleSpacesForCurrentProfile } from "@/lib/zero-limit-id/spaces";
import { getWorkspaceSettings, WorkspaceSettingsError } from "@/lib/zero-limit-id/workspace-settings";

export const dynamic = "force-dynamic";

export default async function SettingsPage({ params }) {
  let context, space;
  try { [context, space] = await Promise.all([getAccessibleSpacesForCurrentProfile(), getWorkspaceSettings(params.spaceId)]); }
  catch (error) { if (error instanceof AuthenticationRequiredError) redirect("/connexion"); if (error instanceof WorkspaceSettingsError && error.status === 404) notFound(); throw error; }
  const labels = spaceDictionary(context.profile.preferred_locale);
  return <PrivateShell {...context} currentSpace={space.status === "active" ? space : null} labels={labels}>
    <section className="workspace-settings">
      <PageHeader eyebrow={labels.settings.title} title={space.name} status={<StatusBadge tone={space.status === "active" ? "active" : space.status === "suspended" ? "danger" : "neutral"}>{labels.settings.statuses[space.status]}</StatusBadge>} />
      <section className="workspace-settings-summary" aria-label={labels.settings.title}>
      <dl><div><dt>{labels.settings.type}</dt><dd>{labels.groups[space.kind]}</dd></div><div><dt>{labels.owner}</dt><dd>{space.owner.name}</dd></div>{space.kind === "personal" && <div><dt>{labels.settings.profession}</dt><dd>{labels.professions[space.profession]} · {labels.settings.immutable}</dd></div>}{space.kind === "team" && <><div><dt>{labels.organization}</dt><dd>{space.organization.name}</dd></div><div><dt>{labels.settings.slug}</dt><dd>{space.organization.slug}</dd></div></>}</dl>
      </section>
      <WorkspaceSettingsForm space={space} labels={labels} />
      <Link className="workspace-button workspace-button-ghost" href={space.status === "active" ? `/espace/${space.id}` : "/espace"}>{labels.back}</Link>
    </section>
  </PrivateShell>;
}
