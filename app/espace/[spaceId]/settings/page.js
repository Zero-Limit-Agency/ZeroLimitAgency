import { notFound, redirect } from "next/navigation";
import { PrivateShell } from "@/components/workspace/private-shell";
import { WorkspaceSettingsClient } from "@/components/workspace/workspace-settings-client";
import { spaceDictionary } from "@/lib/i18n/spaces";
import { AuthenticationRequiredError } from "@/lib/zero-limit-id/profile";
import { getAccessibleModulesForCurrentProfile } from "@/lib/workspace/modules";
import { getAccessibleSpacesForCurrentProfile } from "@/lib/zero-limit-id/spaces";
import { getWorkspaceSettings, WorkspaceSettingsError } from "@/lib/zero-limit-id/workspace-settings";

export const dynamic = "force-dynamic";

export default async function SettingsPage(props) {
  const params = await props.params;
  let context, space;
  try {
    [context, space] = await Promise.all([getAccessibleSpacesForCurrentProfile(), getWorkspaceSettings(params.spaceId)]);
    if (context.spaces.some((accessible) => accessible.id === space.id)) context = await getAccessibleModulesForCurrentProfile(space.id);
  }
  catch (error) { if (error instanceof AuthenticationRequiredError) redirect("/connexion"); if (error instanceof WorkspaceSettingsError && error.status === 404) notFound(); throw error; }
  const labels = spaceDictionary(context.profile.preferred_locale);
  return <PrivateShell {...context} currentSpace={context.spaces.some((accessible) => accessible.id === space.id) ? space : null} labels={labels}>
    <WorkspaceSettingsClient initialSpace={space} labels={labels} />
  </PrivateShell>;
}
