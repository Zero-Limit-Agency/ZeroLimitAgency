import { getAuthorizedClientAccess } from "@/lib/auth/client-access";
import { isSafeTeamInvitationReturnPath } from "@/lib/security/internal-return-url";
import { redirect } from "next/navigation";
import { IdentityAuthForm } from "@/components/identity/auth-form";
import { IdentityShell } from "@/components/identity/identity-shell";
import { getClientSession } from "@/lib/auth/client-auth";
import { teamInvitationReturnPath } from "@/lib/security/internal-return-url";

export const metadata = { title: "Connexion Zero Limit ID | Zero Limit Agency" };

export default async function ConnexionPage({ searchParams }) {
  const next = teamInvitationReturnPath(searchParams?.next);
  const session = await getClientSession();
  if (session?.user && !session.isDemo) {
    const legacy = await getAuthorizedClientAccess(session.user);
    redirect(isSafeTeamInvitationReturnPath(next) ? next : legacy?.application_id ? "/espace-client" : next);
  }
  return <IdentityShell title="Heureux de vous revoir." subtitle="Connectez-vous à votre Zero Limit ID pour retrouver vos espaces et invitations.">
    <IdentityAuthForm mode="login" redirectTo={next} />
  </IdentityShell>;
}
