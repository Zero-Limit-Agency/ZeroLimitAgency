import Link from "next/link";
import { redirect } from "next/navigation";

import { GlobalMarketEditor } from "@/components/admin/global-market-editor";
import { MaintenanceModeEditor } from "@/components/admin/maintenance-mode-editor";
import { SiteContentEditor } from "@/components/admin/site-content-editor";
import { SupportChannelsEditor } from "@/components/admin/support-channels-editor";
import { YoutubeTrainingSettingsEditor } from "@/components/admin/youtube-training-settings-editor";
import { LogoutButton } from "@/components/auth/logout-button";
import { getUserRole, isAdminUser } from "@/lib/auth/admin-access";
import { getClientSession } from "@/lib/auth/client-auth";
import { getYoutubeTrainingSettings } from "@/lib/learn-youtube/settings";
import { getMaintenanceModeState } from "@/lib/maintenance";
import { normalizeSiteContent } from "@/lib/site-content";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const metadata = {
  title: "Administration | Zero Limit Agency"
};

function buildDisplayName(application) {
  return (
    [application?.first_name, application?.last_name].filter(Boolean).join(" ") ||
    application?.pseudo ||
    application?.email ||
    "Client"
  );
}

function formatApplicationDate(value) {
  if (!value) {
    return "Date non disponible";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(date);
}

function RequestCard({ application, tone }) {
  const badgeLabel = tone === "rejected" ? "Refusée" : "En attente";
  const actionVerb = tone === "rejected" ? "Revoir" : "Ouvrir";
  const actionTarget = tone === "rejected" ? "le dossier" : "la fiche";

  return (
    <article className="admin-list-card admin-record-card admin-request-card">
      <div className="admin-list-copy admin-record-copy">
        <div className="admin-card-topline admin-record-topline">
          <small>{application.request_type || "Demande"}</small>
          <span className={`admin-status-badge admin-status-${tone}`}>{badgeLabel}</span>
        </div>
        <h2>{buildDisplayName(application)}</h2>
        <p>
          {application.email || "Email à préciser"} · {application.language || "Langue à préciser"}
        </p>
        <p className="admin-inline-note">Reçue le {formatApplicationDate(application.created_at)}</p>
      </div>

      <div className="admin-record-actions" aria-label={`Actions pour ${buildDisplayName(application)}`}>
        <Link
          className="button button-primary admin-record-action admin-record-action-primary"
          href={`/admin/${application.id}`}
        >
          <span>{actionVerb}</span>
          <strong>{actionTarget}</strong>
        </Link>
      </div>
    </article>
  );
}

function ClientCard({ application }) {
  return (
    <article className="admin-list-card admin-record-card admin-client-card">
      <div className="admin-list-copy admin-record-copy">
        <div className="admin-card-topline admin-record-topline">
          <small>Client</small>
          <span className="admin-status-badge admin-status-approved">Client</span>
        </div>
        <h2>{buildDisplayName(application)}</h2>
        <p>
          {application.company || "Structure à préciser"} · {application.language || "Langue à préciser"}
        </p>
        <p className="admin-inline-note">
          {application.request_type || "Dossier client"} · Validé le {formatApplicationDate(application.updated_at)}
        </p>
      </div>

      <div className="admin-record-actions" aria-label={`Actions pour ${buildDisplayName(application)}`}>
        <Link
          className="button button-primary admin-record-action admin-record-action-primary"
          href={`/admin/${application.id}`}
        >
          <span>Gérer</span>
          <strong>le client</strong>
        </Link>
        <Link
          className="button button-dark admin-record-action"
          href={`/espace-client/${application.id}?admin_preview=1`}
        >
          <span>Voir</span>
          <strong>l'espace client</strong>
        </Link>
      </div>
    </article>
  );
}

function EmptyState({ title, description }) {
  return (
    <article className="admin-empty-state">
      <strong>{title}</strong>
      <p>{description}</p>
    </article>
  );
}

function AdminSection({ eyebrow, title, note, items, kind }) {
  return (
    <section className="admin-panel">
      <div className="admin-panel-heading">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
          <p className="admin-inline-note">{note}</p>
        </div>
      </div>

      <div className="admin-list">
        {items.length > 0 ? (
          items.map((application) =>
            kind === "clients" ? (
              <ClientCard key={application.id} application={application} />
            ) : (
              <RequestCard key={application.id} application={application} tone={kind} />
            )
          )
        ) : kind === "pending_review" ? (
          <EmptyState
            title="Aucune demande en attente."
            description="Les nouvelles inscriptions apparaîtront ici tant qu'elles n'ont pas été traitées."
          />
        ) : kind === "rejected" ? (
          <EmptyState
            title="Aucune demande refusée."
            description="Les dossiers refusés sont conservés ici pour garder un historique propre."
          />
        ) : (
          <EmptyState
            title="Aucun client actif."
            description="Une demande acceptée quitte immédiatement l'attente pour rejoindre cette section."
          />
        )}
      </div>
    </section>
  );
}

export default async function AdminPage({ searchParams }) {
  const session = await getClientSession();

  if (!session?.user) {
    redirect("/connexion");
  }

  const role = await getUserRole(session.user);

  if (!(await isAdminUser(session.user))) {
    if (role === "client") {
      redirect("/espace-client");
    }

    redirect("/connexion");
  }

  const adminClient = createSupabaseAdminClient();
  const result = await adminClient.applications.list();
  const globalMarketResult = await adminClient.globalMarketSettings.get();
  const siteContentResult = await adminClient.globalSiteSettings.get();
  const maintenanceSettings = await getMaintenanceModeState(adminClient);
  const youtubeTrainingSettings = await getYoutubeTrainingSettings(adminClient);
  const applications = result.ok && Array.isArray(result.data) ? result.data : [];
  const globalMarketSettings =
    globalMarketResult.ok && Array.isArray(globalMarketResult.data) && globalMarketResult.data.length > 0
      ? globalMarketResult.data[0]?.settings || {}
      : {};
  const globalSiteSettings =
    siteContentResult.ok && Array.isArray(siteContentResult.data) && siteContentResult.data.length > 0
      ? normalizeSiteContent(siteContentResult.data[0]?.settings || {})
      : undefined;
  const activeFilter = ["pending_review", "approved", "rejected"].includes(searchParams?.status)
    ? searchParams.status
    : "all";

  const pendingApplications = applications.filter((application) => application.status === "pending_review");
  const rejectedApplications = applications.filter((application) => application.status === "rejected");
  const approvedApplications = applications.filter((application) => application.status === "approved");

  return (
    <main className="admin-shell">
      <section className="admin-frame">
        <header className="admin-header">
          <div>
            <p className="eyebrow">Administration</p>
            <h1>Demandes, clients et contenus</h1>
            <p className="admin-lead">
              Gérez les inscriptions, les clients actifs, le site public et le Zero Limit Market depuis
              un seul espace.
            </p>
          </div>

          <div className="admin-header-actions">
            <Link className="button button-dark" href="/">
              Retour au site
            </Link>
            <LogoutButton label="Se déconnecter" />
          </div>
        </header>

        <section className="admin-overview-grid">
          <article className="admin-subpanel">
            <small>En attente</small>
            <strong>{pendingApplications.length}</strong>
            <p className="admin-inline-note">Demandes à traiter avant toute décision.</p>
          </article>
          <article className="admin-subpanel">
            <small>Refusés</small>
            <strong>{rejectedApplications.length}</strong>
            <p className="admin-inline-note">Dossiers refusés, sortis du traitement actif.</p>
          </article>
          <article className="admin-subpanel">
            <small>Clients</small>
            <strong>{approvedApplications.length}</strong>
            <p className="admin-inline-note">Dossiers validés et gérés comme vrais clients.</p>
          </article>
          <article className="admin-subpanel">
            <small>DropMap</small>
            <strong>Confidentiel</strong>
            <p className="admin-inline-note">Pilotez la visibilité privée, maintenance ou publique de /dropmap.</p>
            <div className="admin-actions admin-actions-inline">
              <Link className="button button-dark button-compact" href="/admin/dropmap">
                Réglages DropMap
              </Link>
            </div>
          </article>
          <article className="admin-subpanel">
            <small>Formation</small>
            <strong>YouTube</strong>
            <p className="admin-inline-note">Gérez le catalogue, les ressources et les accès formation.</p>
            <div className="admin-actions admin-actions-inline">
              <Link className="button button-dark button-compact" href="/admin/formations">
                Catalogue formation
              </Link>
            </div>
          </article>
        </section>

        <nav className="admin-filters" aria-label="Filtres administration">
          <Link className={`admin-filter-chip${activeFilter === "all" ? " is-active" : ""}`} href="/admin">
            Tout afficher
          </Link>
          <Link
            className={`admin-filter-chip${activeFilter === "pending_review" ? " is-active" : ""}`}
            href="/admin?status=pending_review"
          >
            En attente
          </Link>
          <Link
            className={`admin-filter-chip${activeFilter === "rejected" ? " is-active" : ""}`}
            href="/admin?status=rejected"
          >
            Refusés
          </Link>
          <Link
            className={`admin-filter-chip${activeFilter === "approved" ? " is-active" : ""}`}
            href="/admin?status=approved"
          >
            Clients
          </Link>
        </nav>

        <div className="admin-sections">
          <MaintenanceModeEditor initialSettings={maintenanceSettings} />
          <YoutubeTrainingSettingsEditor initialSettings={youtubeTrainingSettings} />
          <SupportChannelsEditor initialSettings={globalSiteSettings?.support} />
          <SiteContentEditor initialSettings={globalSiteSettings} />
          <GlobalMarketEditor initialSettings={globalMarketSettings} />

          {(activeFilter === "all" || activeFilter === "pending_review") && (
            <AdminSection
              eyebrow="En attente"
              title="Demandes à traiter"
              note="Les demandes présentes ici sont les seules encore actives côté revue."
              items={pendingApplications}
              kind="pending_review"
            />
          )}

          {(activeFilter === "all" || activeFilter === "rejected") && (
            <AdminSection
              eyebrow="Refusés"
              title="Demandes refusées"
              note="Ces dossiers restent en base, mais ne doivent plus apparaître comme des demandes à traiter."
              items={rejectedApplications}
              kind="rejected"
            />
          )}

          {(activeFilter === "all" || activeFilter === "approved") && (
            <AdminSection
              eyebrow="Clients"
              title="Clients validés"
              note="Une demande acceptée quitte l'attente et rejoint cette section comme client."
              items={approvedApplications}
              kind="clients"
            />
          )}
        </div>
      </section>
    </main>
  );
}
