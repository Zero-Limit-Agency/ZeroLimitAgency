import Link from "next/link";
import { redirect } from "next/navigation";

import { MaintenanceScreen } from "@/components/maintenance-screen";
import { ClientLoginForm } from "@/components/auth/client-login-form";
import { InternalHeader } from "@/components/internal/internal-header";
import { InternalPageShell } from "@/components/internal/internal-page-shell";
import { InternalStatusBadge } from "@/components/internal/internal-status-badge";
import internalStyles from "@/components/internal/internal.module.css";
import { getUserRole } from "@/lib/auth/admin-access";
import { buildClientApplicationUrl, getClientWorkspaceContext } from "@/lib/auth/client-access";
import { getClientSession } from "@/lib/auth/client-auth";
import { DEMO_CLIENT_USER_ID } from "@/lib/auth/demo-client";
import { getMaintenanceModeState } from "@/lib/maintenance";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const metadata = {
  title: "Connexion | Zero Limit Agency"
};

export default async function ConnexionPage({ searchParams }) {
  const session = await getClientSession();
  const role = session?.user ? await getUserRole(session.user) : null;
  const workspace = session?.user ? await getClientWorkspaceContext(session.user) : null;
  const maintenanceSettings = await getMaintenanceModeState(createSupabaseAdminClient());
  const allowAdminAccess = searchParams?.admin_access === "1";

  if (maintenanceSettings.enabled && role !== "admin" && !allowAdminAccess) {
    return <MaintenanceScreen settings={maintenanceSettings} />;
  }

  if (session?.user && !session.isDemo && session.user.id !== DEMO_CLIENT_USER_ID && role === "admin") {
    redirect("/admin");
  }

  if (
    session?.user &&
    !session.isDemo &&
    session.user.id !== DEMO_CLIENT_USER_ID &&
    workspace?.access?.application_id
  ) {
    if (workspace.application?.status === "approved") {
      redirect(buildClientApplicationUrl(workspace.access.application_id));
    }

    redirect("/espace-client");
  }

  return (
    <InternalPageShell variant="auth" framed={false} contentClassName="auth-card auth-card-wide">
      <div className={internalStyles.authLayout}>
        <section className={`${internalStyles.editorialPanel} auth-copy`} aria-label="Présentation de la connexion client">
          <InternalHeader
            eyebrow="Connexion client"
            title="Accéder à votre espace personnel"
            description="Votre espace Zero Limit centralise le suivi de votre dossier, les ressources utiles et les prochaines étapes de votre accompagnement."
            badge={<InternalStatusBadge variant="client">Zero Limit Agency</InternalStatusBadge>}
            compact
          />

          <div className="auth-copy-note">
            <strong>Accès sécurisé</strong>
            <p>
              Chaque client accède uniquement à son propre espace. Une fois connecté, vous retrouvez
              votre profil, vos ressources et l'état de votre accompagnement.
            </p>
          </div>

          <div className={internalStyles.metricsGrid} aria-label="Repères de l'espace client Zero Limit">
            <span className={internalStyles.metricCard}>
              <strong>Suivi privé</strong>
              <small>Dossier, statut et ressources au même endroit.</small>
            </span>
            <span className={internalStyles.metricCard}>
              <strong>Accès maîtrisé</strong>
              <small>Chaque session reste liée à un seul accompagnement.</small>
            </span>
            <span className={internalStyles.metricCard}>
              <strong>Démo isolée</strong>
              <small>Un aperçu fictif existe sans ouvrir de données réelles.</small>
            </span>
          </div>

          <div className="auth-actions auth-actions-stacked auth-copy-actions">
            <Link className="button button-dark" href="/">
              Retour au site
            </Link>
          </div>
        </section>

        <section className={`${internalStyles.panel} auth-panel`} aria-label="Formulaire de connexion client">
          <ClientLoginForm />
        </section>
      </div>
    </InternalPageShell>
  );
}
