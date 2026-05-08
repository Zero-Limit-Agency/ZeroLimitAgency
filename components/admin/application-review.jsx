"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { DeleteApplicationButton } from "@/components/admin/delete-application-button";

function formatAdminDate(value) {
  if (!value) {
    return "Non renseigné";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function buildStatusLabel(status) {
  if (status === "rejected") {
    return "Refusée";
  }

  return "En attente";
}

export function ApplicationReview({ application }) {
  const router = useRouter();
  const [state, setState] = useState({
    status: "idle",
    message: ""
  });

  async function submitDecision(action) {
    setState({
      status: "loading",
      message:
        action === "approve"
          ? "Acceptation de la requête en cours..."
          : "Refus de la requête en cours..."
    });

    try {
      const response = await fetch(`/api/admin/applications/${application.id}/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ action })
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        throw new Error(
          result?.error ||
            (action === "approve"
              ? "Impossible d'accepter cette requête."
              : "Impossible de refuser cette requête.")
        );
      }

      setState({
        status: "success",
        message: result.message || "Action enregistrée."
      });

      router.refresh();

      if (action === "approve") {
        window.setTimeout(() => {
          window.location.assign(`/admin/${application.id}`);
        }, 700);
      }
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof Error ? error.message : "Une erreur est survenue pendant le traitement."
      });
    }
  }

  return (
    <div className="admin-editor">
      {application?.drive_transfer_error ? (
        <section className="admin-panel admin-panel-warning">
          <div className="admin-system-warning">
            <small>Alerte Google Drive</small>
            <strong>Fichiers non transférés vers Google Drive</strong>
            <p>
              {application.drive_transfer_error}. La demande est bien enregistrée, mais les fichiers n'ont pas pu
              être envoyés dans Drive.
            </p>
          </div>
        </section>
      ) : null}

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <p className="eyebrow">Lecture de la requête</p>
            <h2>Informations reçues</h2>
          </div>
          <span className={`admin-status-badge admin-status-${application.status || "pending_review"}`}>
            {buildStatusLabel(application.status)}
          </span>
        </div>

        <div className="admin-meta-grid">
          <div className="admin-subpanel">
            <small>Nom</small>
            <strong>
              {[application.first_name, application.last_name].filter(Boolean).join(" ") || "Non renseigné"}
            </strong>
          </div>
          <div className="admin-subpanel">
            <small>Email</small>
            <strong>{application.email || "Non renseigné"}</strong>
          </div>
          <div className="admin-subpanel">
            <small>Pays</small>
            <strong>{application.country || "Non renseigné"}</strong>
          </div>
          <div className="admin-subpanel">
            <small>Langue</small>
            <strong>{application.language || "Non renseignée"}</strong>
          </div>
          <div className="admin-subpanel">
            <small>Type de demande</small>
            <strong>{application.request_type || "Non renseigné"}</strong>
          </div>
          <div className="admin-subpanel">
            <small>Date</small>
            <strong>{formatAdminDate(application.created_at)}</strong>
          </div>
        </div>

        <div className="admin-subpanel">
          <small>Message brut</small>
          <p className="admin-raw-message">{application.message_raw || "Aucun message fourni."}</p>
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <p className="eyebrow">Decision</p>
            <h2>Accepter ou refuser la demande</h2>
          </div>
        </div>

        <div className="admin-decision-grid">
          <article className="admin-subpanel">
            <small>Accepter</small>
            <strong>Convertir en client</strong>
            <p className="admin-inline-note">
              La requête passe en <em>approved</em>. Le client se connectera ensuite avec l'email et le mot
              de passe déjà choisis lors de l'inscription.
            </p>
            <button
              className="button button-primary"
              type="button"
              onClick={() => submitDecision("approve")}
              disabled={state.status === "loading"}
            >
              Accepter la requête
            </button>
          </article>

          <article className="admin-subpanel">
            <small>Refuser</small>
            <strong>Conserver l'historique</strong>
            <p className="admin-inline-note">
              La ligne reste en base avec le statut <em>rejected</em> et un email de refus simple
              est envoyé au demandeur.
            </p>
            <button
              className="button button-dark"
              type="button"
              onClick={() => submitDecision("reject")}
              disabled={state.status === "loading"}
            >
              Refuser la requête
            </button>
          </article>
        </div>

        {state.message ? (
          <p
            className={`auth-feedback ${
              state.status === "error"
                ? "auth-feedback-error"
                : state.status === "success"
                  ? "auth-feedback-success"
                  : ""
            }`}
          >
            {state.message}
          </p>
        ) : null}
      </section>

      {application.status === "rejected" ? (
        <section className="admin-panel admin-panel-danger">
          <div className="admin-panel-heading">
            <div>
              <p className="eyebrow">Zone sensible</p>
              <h2>Suppression définitive</h2>
            </div>
          </div>

          <DeleteApplicationButton applicationId={application.id} variant="rejected" />
        </section>
      ) : null}
    </div>
  );
}

