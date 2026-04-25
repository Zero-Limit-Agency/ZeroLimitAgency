import Link from "next/link";
import { redirect } from "next/navigation";

import { GlobalMarketEditor } from "@/components/admin/global-market-editor";
import { MaintenanceModeEditor } from "@/components/admin/maintenance-mode-editor";
import { SiteContentEditor } from "@/components/admin/site-content-editor";
import { LogoutButton } from "@/components/auth/logout-button";
import { getUserRole, isAdminUser } from "@/lib/auth/admin-access";
import { getClientSession } from "@/lib/auth/client-auth";
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
  const badgeLabel = tone === "rejected" ? "Refusee" : "En attente";

  return (
    <article className="admin-list-card admin-request-card">
      <div className="admin-list-copy">
        <div className="admin-card-topline">
          <small>{application.request_type || "Demande"}</small>
          <span className={`admin-status-badge admin-status-${tone}`}>{badgeLabel}</span>
        </div>
        <h2>{buildDisplayName(application)}</h2>
        <p>
          {application.email || "Email a preciser"} · {application.language || "Langue a preciser"}
        </p>
        <p className="admin-inline-note">Recue le {formatApplicationDate(application.created_at)}</p>
      </div>

      <div className="admin-list-actions">
        <Link className="button button-primary" href={`/admin/${application.id}`}>
          Ouvrir la fiche
        </Link>
      </div>
    </article>
  );
}

function ClientCard({ application }) {
  return (
    <article className="admin-list-card admin-client-card">
      <div className="admin-list-copy">
        <div className="admin-card-topline">
          <small>Client</small>
          <span className="admin-status-badge admin-status-approved">Client</span>
        </div>
        <h2>{buildDisplayName(application)}</h2>
        <p>
          {application.company || "Structure a preciser"} · {application.language || "Langue a preciser"}
        </p>
        <p className="admin-inline-note">
          {application.request_type || "Dossier client"} · Valide le {formatApplicationDate(application.updated_at)}
        </p>
      </div>

      <div className="admin-list-actions">
        <Link className="button button-primary" href={`/admin/${application.id}`}>
          Gerer le client
        </Link>
        <Link className="button button-dark" href={`/espace-client/${application.id}?admin_preview=1`}>
          Voir l'espace client
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
            description="Les nouvelles inscriptions apparaitront ici tant qu'elles n'ont pas ete traitees."
          />
        ) : kind === "rejected" ? (
          <EmptyState
            title="Aucune demande refusee."
            description="Les dossiers refuses sont conserves ici pour garder un historique propre."
          />
        ) : (
          <EmptyState
            title="Aucun client actif."
            description="Une demande acceptee quitte immediatement l'attente pour rejoindre cette section."
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
              Gerez les inscriptions, les clients actifs, le site public et le Zero Limit Market depuis
              un seul espace.
            </p>
          </div>

          <div className="admin-header-actions">
            <Link className="button button-dark" href="/">
              Retour au site
            </Link>
            <LogoutButton label="Se deconnecter" />
          </div>
        </header>

        <section className="admin-overview-grid">
          <article className="admin-subpanel">
            <small>En attente</small>
            <strong>{pendingApplications.length}</strong>
            <p className="admin-inline-note">Demandes a traiter avant toute decision.</p>
          </article>
          <article className="admin-subpanel">
            <small>Refuses</small>
            <strong>{rejectedApplications.length}</strong>
            <p className="admin-inline-note">Dossiers refuses, sortis du traitement actif.</p>
          </article>
          <article className="admin-subpanel">
            <small>Clients</small>
            <strong>{approvedApplications.length}</strong>
            <p className="admin-inline-note">Dossiers valides et geres comme vrais clients.</p>
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
            Refuses
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
          <SiteContentEditor initialSettings={globalSiteSettings} />
          <GlobalMarketEditor initialSettings={globalMarketSettings} />

          {(activeFilter === "all" || activeFilter === "pending_review") && (
            <AdminSection
              eyebrow="En attente"
              title="Demandes a traiter"
              note="Les demandes presentes ici sont les seules encore actives cote revue."
              items={pendingApplications}
              kind="pending_review"
            />
          )}

          {(activeFilter === "all" || activeFilter === "rejected") && (
            <AdminSection
              eyebrow="Refuses"
              title="Demandes refusees"
              note="Ces dossiers restent en base, mais ne doivent plus apparaitre comme des demandes a traiter."
              items={rejectedApplications}
              kind="rejected"
            />
          )}

          {(activeFilter === "all" || activeFilter === "approved") && (
            <AdminSection
              eyebrow="Clients"
              title="Clients valides"
              note="Une demande acceptee quitte l'attente et rejoint cette section comme client."
              items={approvedApplications}
              kind="clients"
            />
          )}
        </div>
      </section>
    </main>
  );
}
