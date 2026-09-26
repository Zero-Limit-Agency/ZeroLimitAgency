import { redirect } from "next/navigation";
import { IdentityAuthForm } from "@/components/identity/auth-form";
import { IdentityShell } from "@/components/identity/identity-shell";
import { getClientSession } from "@/lib/auth/client-auth";
import { teamInvitationReturnPath } from "@/lib/security/internal-return-url";

export const metadata = { title: "Connexion Zero Limit ID | Zero Limit Agency" };

export default async function ConnexionPage({ searchParams }) {
  const next = teamInvitationReturnPath(searchParams?.next);
  if ((await getClientSession())?.user) redirect(next);
  return <IdentityShell title="Heureux de vous revoir." subtitle="Connectez-vous à votre Zero Limit ID pour retrouver vos espaces et invitations.">
    <IdentityAuthForm mode="login" redirectTo={next} />
  </IdentityShell>;
}
