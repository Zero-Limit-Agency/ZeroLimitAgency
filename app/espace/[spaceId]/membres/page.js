import { notFound, redirect } from "next/navigation";
import { PrivateShell } from "@/components/workspace/private-shell";
import { TeamMembersManager } from "@/components/workspace/team-members-manager";
import { spaceDictionary } from "@/lib/i18n/spaces";
import { AuthenticationRequiredError } from "@/lib/zero-limit-id/profile";
import { reportSpaceDataAccessError, requireSpaceAccess } from "@/lib/zero-limit-id/spaces";
import { SpaceAccessDeniedError } from "@/lib/zero-limit-id/space-model";
import { getTeamManagement, TeamManagementError } from "@/lib/zero-limit-id/team-management";

export const dynamic = "force-dynamic";

export default async function TeamMembersPage({ params }) {
  let context;
  try {
    context = await requireSpaceAccess(params.spaceId);
    if (context.space.kind !== "team") notFound();
    const canManageInvitations = context.space.isOwner || context.space.role === "admin";
    context.management = await getTeamManagement(context.space.organization.id, canManageInvitations);
  } catch (error) {
    if (error instanceof AuthenticationRequiredError || error instanceof TeamManagementError && error.code === "authentication_required") redirect("/identite/connexion");
    if (error instanceof SpaceAccessDeniedError) notFound();
    const correlationId = reportSpaceDataAccessError(error, "/espace/[spaceId]/membres");
    if (correlationId) return <main className="identity-shell"><section className="identity-card"><h1>Service indisponible</h1><p>Réessayez dans quelques instants.</p><code>{correlationId}</code></section></main>;
    if (error instanceof TeamManagementError) {
      const teamCorrelationId = crypto.randomUUID();
      console.error("[team-management] read failure", { correlationId: teamCorrelationId, code: error.code });
      return <main className="identity-shell"><section className="identity-card"><h1>Service indisponible</h1><p>Réessayez dans quelques instants.</p><code>{teamCorrelationId}</code></section></main>;
    }
    throw error;
  }
  const labels = spaceDictionary(context.profile.preferred_locale);
  return <PrivateShell {...context} currentSpace={context.space} labels={labels}>
    <TeamMembersManager
      organizationId={context.space.organization.id}
      spaceId={context.space.id}
      currentProfileId={context.profile.id}
      actor={{ isOwner: context.space.isOwner, role: context.space.role }}
      initialData={context.management}
      labels={labels}
    />
  </PrivateShell>;
}
