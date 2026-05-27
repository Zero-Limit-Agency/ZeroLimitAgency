import Link from "next/link";

import { PasswordSetupForm } from "@/components/auth/password-setup-form";

export const metadata = {
  title: "Définir le mot de passe | Zero Limit Agency"
};

export default function PasswordSetupPage() {
  return (
    <main className="auth-shell">
      <section className="auth-card auth-card-wide">
        <div className="auth-copy">
          <p className="eyebrow">Activation client</p>
          <h1>Définissez votre mot de passe</h1>
          <p>
            Finalisez l'activation de votre espace client pour accéder à votre dossier, à vos
            ressources et au suivi de votre accompagnement.
          </p>
          <div className="auth-copy-note">
            <strong>Étape unique</strong>
            <p>
              Une fois le mot de passe enregistré, votre accès sera automatiquement activé et vous
              serez redirigé vers votre espace client.
            </p>
          </div>
          <div className="auth-copy-note">
            <strong>Besoin d'un nouveau lien ?</strong>
            <p>
              Si l'email n'est plus valable ou si le lien a expiré, nous pouvons renvoyer un nouvel
              accès rapidement via l'équipe support.
            </p>
          </div>
        </div>

        <div className="auth-panel">
          <PasswordSetupForm />

          <div className="auth-actions auth-actions-stacked">
            <Link className="button button-dark" href="/connexion">
              Retour à la connexion
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
