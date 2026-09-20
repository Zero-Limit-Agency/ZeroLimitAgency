import { notFound, redirect } from "next/navigation";
import { PrivateShell } from "@/components/workspace/private-shell";
import { SpaceLanding } from "@/components/workspace/space-landing";
import { spaceDictionary } from "@/lib/i18n/spaces";
import { AuthenticationRequiredError } from "@/lib/zero-limit-id/profile";
import { reportSpaceDataAccessError } from "@/lib/zero-limit-id/spaces";
import { SpaceAccessDeniedError } from "@/lib/zero-limit-id/space-model";
import { getAccessibleModulesForCurrentProfile } from "@/lib/workspace/modules";

export const dynamic = "force-dynamic";

export default async function SpacePage({ params }) {
  let context;
  try { context = await getAccessibleModulesForCurrentProfile(params.spaceId); }
  catch (error) {
    if (error instanceof AuthenticationRequiredError) redirect("/identite/connexion");
    if (error instanceof SpaceAccessDeniedError) notFound();
    const correlationId = reportSpaceDataAccessError(error, "/espace/[spaceId]");
    if (correlationId) return <main className="identity-shell"><section className="identity-card"><h1>Service indisponible</h1><p>Réessayez dans quelques instants.</p><code>{correlationId}</code></section></main>;
    throw error;
  }
  const labels = spaceDictionary(context.profile.preferred_locale);
  return <PrivateShell {...context} currentSpace={context.space} labels={labels}><SpaceLanding space={context.space} labels={labels} /></PrivateShell>;
}
