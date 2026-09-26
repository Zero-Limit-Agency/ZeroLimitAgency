import { IdentityAuthForm } from "@/components/identity/auth-form";
import { IdentityShell } from "@/components/identity/identity-shell";
import { teamInvitationReturnPath } from "@/lib/security/internal-return-url";

export const metadata = { title: "Créer un Zero Limit ID | Zero Limit Agency" };

export default function InscriptionPage({ searchParams }) {
  const next = teamInvitationReturnPath(searchParams?.next);
  return <IdentityShell title="Créez votre identité." subtitle="Un identifiant unique et durable pour toutes vos expériences Zero Limit.">
    <IdentityAuthForm mode="signup" redirectTo={next} />
  </IdentityShell>;
}
