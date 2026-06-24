import Link from "next/link";
import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/auth/logout-button";
import { MaintenanceScreen } from "@/components/maintenance-screen";
import { InternalEmptyState } from "@/components/internal/internal-empty-state";
import { InternalHeader } from "@/components/internal/internal-header";
import { InternalPageShell } from "@/components/internal/internal-page-shell";
import { InternalSectionHeading } from "@/components/internal/internal-section-heading";
import { InternalStatusBadge } from "@/components/internal/internal-status-badge";
import internalStyles from "@/components/internal/internal.module.css";
import { getUserRole } from "@/lib/auth/admin-access";
import { buildClientApplicationUrl, getClientWorkspaceContext } from "@/lib/auth/client-access";
import { getClientSession } from "@/lib/auth/client-auth";
import { getMaintenanceModeState } from "@/lib/maintenance";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const metadata = {
  title: "Espace client | Zero Limit Agency"
};

function buildStatusContent(application) {
  if (!application) {
    return {
      title: "Votre espace client n'est pas encore disponible",
      description:
        "Votre dossier n'est pas encore relié à un espace client exploitable. Contactez Zero Limit Agency si besoin.",
      tone: "neutral"
    };
  }

  if (application.status === "rejected") {
    return {
      title: "Votre inscription a été refusée par l'équipe",
      description:
        "Pour toute question complémentaire, vous pouvez nous contacter par e-mail afin d'échanger sur votre demande.",
      tone: "rejected"
    };
  }

  return {
    title: "Votre demande est en cours d'analyse",
    description:
      "Nous étudions actuellement votre inscription. Vous pourrez accéder à votre espace client complet dès validation par l'équipe.",
    tone: "pending"
  };
}

function formatRequestTypeLabel(value) {
  switch (String(value || "").trim().toLowerCase()) {
    case "contact":
      return "Collaboration";
    case "collaboration":
      return "Collaboration";
    case "inscription_devis":
      return "Inscription avec devis";
    case "partnership":
      return "Partenariat";
    case "other":
      return "Autre demande";
    default:
      return value || "Demande";
  }
}

export default async function ClientSpaceIndexPage() {
  const session = await getClientSession();
  const role = session?.user ? await getUserRole(session.user) : null;
  const maintenanceSettings = await getMaintenanceModeState(createSupabaseAdminClient());

  if (role === "admin") {
    redirect("/admin");
  }

  if (maintenanceSettings.enabled) {
    return <MaintenanceScreen settings={maintenanceSettings} />;
  }

  if (!session?.user) {
    return (
      <InternalPageShell legacyClassName="client-hub-shell" contentClassName="client-hub-frame">
        <InternalHeader
          eyebrow="Espace client"
          title="Un espace privé pour suivre votre dossier."
          description="Votre espace client est séparé du site public. Une fois connecté, vous accédez uniquement à votre dossier, à ses ressources utiles et au suivi de votre accompagnement."
          badge={<InternalStatusBadge variant="client">Accès personnel</InternalStatusBadge>}
          actions={
            <>
              <Link className="button button-primary" href="/connexion">
                Accéder à la connexion client
              </Link>
              <Link className="button button-dark" href="/">
                Retour au site public
              </Link>
            </>
          }
        />

        <section className={internalStyles.actionsGrid} aria-label="Accès et fonctionnement de l'espace client">
          <div className={internalStyles.panel}>
            <InternalSectionHeading
              eyebrow="Fonctionnement"
              title="Un dossier, une session, un suivi."
              description="L'espace client reste volontairement privé : l'équipe valide le dossier avant d'ouvrir l'accompagnement réel."
            />
            <div className={internalStyles.metricsGrid}>
              <span className={internalStyles.metricCard}>
                <strong>Privé</strong>
                <small>Accès uniquement après authentification ou démonstration isolée.</small>
              </span>
              <span className={internalStyles.metricCard}>
                <strong>Structuré</strong>
                <small>Dossier, ressources et prochaines étapes rassemblés.</small>
              </span>
              <span className={internalStyles.metricCard}>
                <strong>Accompagné</strong>
                <small>Chaque demande reste relue par l'équipe avant ouverture complète.</small>
              </span>
            </div>
          </div>

          <aside className={internalStyles.panel} aria-label="Prochaine action">
            <InternalEmptyState
              title="Connectez-vous pour continuer."
              description="Si votre dossier a déjà été validé, vous serez redirigé vers son tableau de bord. Sinon, vous verrez l'état actuel de votre demande."
            />
          </aside>
        </section>
      </InternalPageShell>
    );
  }

  const { access, application } = await getClientWorkspaceContext(session.user);

  if (access?.application_id && application?.status === "approved") {
    redirect(buildClientApplicationUrl(access.application_id));
  }

  const statusContent = buildStatusContent(application);

  return (
    <InternalPageShell
      legacyClassName="client-hub-shell"
      contentClassName={`client-hub-frame client-hub-frame-${statusContent.tone}`}
    >
      <InternalHeader
        eyebrow="Espace client"
        title={statusContent.title}
        description={statusContent.description}
        badge={
          <InternalStatusBadge variant={application?.status === "rejected" ? "danger" : "client"}>
            {application?.status === "rejected" ? "Demande refusée" : "Suivi en cours"}
          </InternalStatusBadge>
        }
        actions={
          <>
            <Link className="button button-dark" href="/">
              Retour au site public
            </Link>
            <LogoutButton />
          </>
        }
      />

      <section className={internalStyles.actionsGrid} aria-label="État actuel du dossier">
        <div className={internalStyles.panel}>
          <InternalSectionHeading
            eyebrow="Dossier principal"
            title="Informations disponibles"
            description="Cette vue reste volontairement limitée tant que l'équipe n'a pas ouvert l'espace complet."
          />
          <div className="client-hub-grid">
            <article className="client-hub-card">
              <strong>Dossier</strong>
              <p>
                {application
                  ? `${formatRequestTypeLabel(application.request_type)} · ${
                      application.language || "Langue non renseignée"
                    }`
                  : "Aucune demande exploitable n'a encore été retrouvée pour ce compte."}
              </p>
            </article>
            <article className="client-hub-card">
              <strong>Statut actuel</strong>
              <p>
                {application?.status === "rejected"
                  ? "Refusé"
                  : application?.status === "pending_review"
                    ? "En cours d'analyse"
                    : "En attente"}
              </p>
            </article>
            <article className="client-hub-card">
              <strong>Contact</strong>
              <p>contact@zerolimit.agency</p>
            </article>
          </div>
        </div>

        <aside className={internalStyles.panel}>
          <InternalEmptyState
            title={application ? "Prochaine étape : validation humaine." : "Aucun dossier exploitable."}
            description={application ? "L'équipe Zero Limit vous donnera accès au tableau de bord complet dès que votre dossier sera prêt." : "Contactez l'équipe si vous pensez que votre demande devrait déjà être liée à ce compte."}
          />
        </aside>
      </section>
    </InternalPageShell>
  );
}
