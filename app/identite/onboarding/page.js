import { teamInvitationReturnPath } from "@/lib/security/internal-return-url";
import { redirect } from "next/navigation";
import { IdentityShell } from "@/components/identity/identity-shell";
import { IdentityUnavailable } from "@/components/identity/identity-unavailable";
import { OnboardingForm } from "@/components/identity/onboarding-form";
import { reportProfileDataAccessError } from "@/lib/zero-limit-id/diagnostics";
import { AuthenticationRequiredError, ensureCurrentProfile } from "@/lib/zero-limit-id/profile";

export default async function Page(props) {
  const searchParams = await props.searchParams;
  let profile;
  try {
    profile = await ensureCurrentProfile();
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) redirect("/connexion");
    const correlationId = reportProfileDataAccessError(error, "/identite/onboarding");
    if (correlationId) return <IdentityUnavailable correlationId={correlationId} />;
    throw error;
  }
  if (profile.onboarding_completed_at) redirect(teamInvitationReturnPath(searchParams?.next));
  return <IdentityShell title="Bienvenue" subtitle="Trois étapes rapides, sans créer d’abonnement ni de workspace."><OnboardingForm profile={profile} next={teamInvitationReturnPath(searchParams?.next)} /></IdentityShell>;
}
