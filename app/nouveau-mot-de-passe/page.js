import { NewPasswordForm } from "@/components/identity/password-flow";
import { IdentityShell } from "@/components/identity/identity-shell";

export const metadata = { title: "Nouveau mot de passe | Zero Limit Agency" };
export default function NewPasswordPage() {
  return <IdentityShell title="Choisissez un nouvel accès." subtitle="Votre nouveau mot de passe doit comporter au moins huit caractères."><NewPasswordForm /></IdentityShell>;
}
