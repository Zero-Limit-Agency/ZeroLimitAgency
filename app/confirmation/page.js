import { ConfirmationSession } from "@/components/identity/confirmation-session";
import { IdentityShell } from "@/components/identity/identity-shell";

export const metadata = { title: "Confirmation | Zero Limit Agency" };
export default function ConfirmationPage() {
  return <IdentityShell title="Confirmation en cours." subtitle="Nous finalisons votre session sécurisée. Cette étape ne prend qu’un instant."><ConfirmationSession /></IdentityShell>;
}
