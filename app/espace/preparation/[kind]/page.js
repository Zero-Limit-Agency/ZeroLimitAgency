import { isInteractiveProvisioningEnabled } from "@/lib/zero-limit-id/environment";
import Link from "next/link";
import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import { PrivateShell } from "@/components/workspace/private-shell";
import { ProvisioningForm } from "@/components/workspace/provisioning-form";
import { PageHeader } from "@/components/workspace/page-header";
import { spaceDictionary } from "@/lib/i18n/spaces";
import { AuthenticationRequiredError } from "@/lib/zero-limit-id/profile";
import { getAccessibleSpacesForCurrentProfile } from "@/lib/zero-limit-id/spaces";

export default async function PreparationPage(props) {
  const params = await props.params;
  if (!["personal", "creator", "team"].includes(params.kind)) notFound();
  let context;
  try { context = await getAccessibleSpacesForCurrentProfile(); }
  catch (error) { if (error instanceof AuthenticationRequiredError) redirect("/connexion"); throw error; }
  if (!context.profile.onboarding_completed_at) redirect("/identite/onboarding");
  const labels = spaceDictionary(context.profile.preferred_locale);
  const existingProfessions = context.spaces.filter((space) => space.kind === "personal").map((space) => space.profession);
  return <PrivateShell {...context} currentSpace={null} labels={labels}><section className="space-selector-page provisioning-page"><PageHeader eyebrow={labels.preparation} title={labels.provisionTitles[params.kind]} description={labels.provisionDescriptions[params.kind]} />{params.kind === "team" && <div className="team-choice"><strong>{labels.createTeam}</strong><p>{labels.joinByInvitation}</p></div>}{isInteractiveProvisioningEnabled() ? <ProvisioningForm kind={params.kind} labels={labels} existingProfessions={existingProfessions} creatorExists={context.spaces.some((space) => space.kind === "creator")} /> : <p className="identity-hint" role="status">{labels.provisioningUnavailable}</p>}<Link className="workspace-button workspace-button-ghost" href="/espace">{labels.back}</Link></section></PrivateShell>;
}
