import { ForgotPasswordForm } from "@/components/identity/password-flow";
import { IdentityShell } from "@/components/identity/identity-shell";

export const metadata = { title: "Mot de passe oublié | Zero Limit Agency" };
export default function ForgotPasswordPage() {
  return <IdentityShell title="Retrouvez votre accès." subtitle="Indiquez votre adresse email. Si un compte correspond, nous vous enverrons un lien sécurisé."><ForgotPasswordForm /></IdentityShell>;
}
