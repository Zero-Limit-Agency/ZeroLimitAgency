"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { DeleteApplicationButton } from "@/components/admin/delete-application-button";

function createResourceDraft(existing = {}) {
  return {
    key: existing.key || "",
    name: existing.name || "",
    kind: existing.kind || "",
    description: existing.description || "",
    url: existing.url || "",
    logo_url: existing.logo_url || ""
  };
}

function createTimelineDraft(existing = {}) {
  return {
    key: existing.key || "",
    label: existing.label || "",
    date: existing.date || "",
    description: existing.description || "",
    tone: existing.tone || "upcoming"
  };
}

function createPacketForm(existing = {}) {
  return {
    summary_message: existing.summary_message || "",
    payment_url: existing.payment_url || "",
    status: existing.status === "sent" ? "sent" : "draft",
    welcome_file_name: existing.welcome_file_name || "",
    welcome_storage_path: existing.welcome_storage_path || "",
    quote_file_name: existing.quote_file_name || "",
    quote_storage_path: existing.quote_storage_path || "",
    contract_file_name: existing.contract_file_name || "",
    contract_storage_path: existing.contract_storage_path || ""
  };
}

function formatAdminDate(value) {
  if (!value) {
    return "Non renseigne";
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

function formatProjectDate(value) {
  if (!value) {
    return "A definir";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long"
  }).format(date);
}

function buildSpaceStatusLabel(status) {
  return status === "active" ? "Accompagnement debloque" : "Espace en preparation";
}

function buildDefaultTimeline(application, profile) {
  if (Array.isArray(profile?.timeline_events) && profile.timeline_events.length > 0) {
    return profile.timeline_events.map(createTimelineDraft);
  }

  const acceptedDate = formatProjectDate(application?.updated_at || application?.created_at);

  return [
    createTimelineDraft({
      key: "accepted",
      label: "Dossier accepte",
      date: acceptedDate,
      description: "Le dossier a ete valide et prepare pour l'accompagnement client.",
      tone: "done"
    }),
    createTimelineDraft({
      key: "call",
      label: "Prise de rendez-vous",
      date: "A planifier",
      description: "Etape prevue pour cadrer le plan, les priorites et les ressources a activer.",
      tone: "current"
    }),
    createTimelineDraft({
      key: "support",
      label: "Accompagnement reel",
      date: "Apres validation du plan",
      description: "Le dossier sera enrichi une fois l'espace client debloque.",
      tone: "upcoming"
    })
  ];
}

export function ApplicationEditor({ application, profile, access, postCallZeroPacket, clientSpaceUrl }) {
  const router = useRouter();
  const [state, setState] = useState({
    status: "idle",
    message: ""
  });
  const [postCallZeroState, setPostCallZeroState] = useState({
    status: "idle",
    message: ""
  });
  const [packetForm, setPacketForm] = useState(() => createPacketForm(postCallZeroPacket));
  const [packetFiles, setPacketFiles] = useState({
    welcome_file: null,
    quote_file: null,
    contract_file: null
  });
  const [form, setForm] = useState({
    first_name: application?.first_name || "",
    last_name: application?.last_name || "",
    pseudo: application?.pseudo || "",
    email: application?.email || "",
    request_type: application?.request_type || "",
    company: application?.company || "",
    country: application?.country || "",
    language: application?.language || "",
    message_rewritten: application?.message_rewritten || application?.message_raw || "",
    drive_folder_url: application?.drive_folder_url || "",
    notion_url: profile?.notion_url || "",
    space_status: profile?.space_status || "preparing",
    market_access_enabled: Boolean(profile?.market_access_enabled),
    resource_links:
      Array.isArray(profile?.resource_links) && profile.resource_links.length > 0
        ? profile.resource_links.map(createResourceDraft)
        : [createResourceDraft()],
    timeline_events: buildDefaultTimeline(application, profile)
  });

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  function updateArrayField(field, index, key, value) {
    setForm((current) => ({
      ...current,
      [field]: current[field].map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [key]: value
            }
          : item
      )
    }));
  }

  function updatePacketField(field, value) {
    setPacketForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  function updatePacketFile(field, file) {
    setPacketFiles((current) => ({
      ...current,
      [field]: file || null
    }));
  }

  function applyPacket(packet) {
    setPacketForm(createPacketForm(packet));
    setPacketFiles({
      welcome_file: null,
      quote_file: null,
      contract_file: null
    });
  }

  function buildPacketFormData(statusOverride) {
    const body = new FormData();
    body.set("summary_message", packetForm.summary_message);
    body.set("payment_url", packetForm.payment_url);
    body.set("status", statusOverride || packetForm.status || "draft");

    Object.entries(packetFiles).forEach(([field, file]) => {
      if (file instanceof File) {
        body.set(field, file);
      }
    });

    return body;
  }

  function addResource() {
    setForm((current) => ({
      ...current,
      resource_links: [...current.resource_links, createResourceDraft()]
    }));
  }

  function removeResource(index) {
    setForm((current) => ({
      ...current,
      resource_links: current.resource_links.filter((_, itemIndex) => itemIndex !== index)
    }));
  }

  function addTimelineEvent() {
    setForm((current) => ({
      ...current,
      timeline_events: [...current.timeline_events, createTimelineDraft()]
    }));
  }

  function removeTimelineEvent(index) {
    setForm((current) => ({
      ...current,
      timeline_events: current.timeline_events.filter((_, itemIndex) => itemIndex !== index)
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setPostCallZeroState({
      status: "idle",
      message: ""
    });

    setState({
      status: "loading",
      message: "Mise a jour du dossier en cours..."
    });

    try {
      const response = await fetch(`/api/admin/applications/${application.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          application: {
            first_name: form.first_name,
            last_name: form.last_name,
            pseudo: form.pseudo,
            email: form.email,
            request_type: form.request_type,
            company: form.company,
            country: form.country,
            language: form.language,
            message_rewritten: form.message_rewritten,
            drive_folder_url: form.drive_folder_url
          },
          profile: {
            notion_url: form.notion_url,
            space_status: form.space_status,
            market_access_enabled: form.market_access_enabled,
            resource_links: form.resource_links,
            timeline_events: form.timeline_events
          }
        })
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Impossible de mettre a jour ce dossier.");
      }

      setState({
        status: "success",
        message: result?.message || "Dossier client mis a jour."
      });

      router.refresh();
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "Impossible de mettre a jour ce dossier."
      });
    }
  }

  async function handleSavePostCallZeroPacket() {
    setState({
      status: "idle",
      message: ""
    });
    setPostCallZeroState({
      status: "loading",
      message: "Enregistrement du pack de demarrage client en cours..."
    });

    try {
      const response = await fetch(`/api/admin/applications/${application.id}/post-call-zero`, {
        method: "PATCH",
        body: buildPacketFormData(packetForm.status)
      });
      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Impossible d'enregistrer le pack de demarrage client.");
      }

      setPostCallZeroState({
        status: "success",
        message: result.message || "Le pack de demarrage client a bien ete enregistre."
      });
      applyPacket(result.packet);
      router.refresh();
    } catch (error) {
      setPostCallZeroState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Impossible d'enregistrer le pack de demarrage client."
      });
    }
  }

  async function handleSendPostCallZeroEmail() {
    setState({
      status: "idle",
      message: ""
    });
    setPostCallZeroState({
      status: "loading",
      message: "Envoi du pack de demarrage client en cours..."
    });

    try {
      const saveResponse = await fetch(`/api/admin/applications/${application.id}/post-call-zero`, {
        method: "PATCH",
        body: buildPacketFormData("draft")
      });
      const saveResult = await saveResponse.json().catch(() => null);

      if (!saveResponse.ok || !saveResult?.success) {
        throw new Error(saveResult?.error || "Impossible d'enregistrer le pack avant l'envoi.");
      }

      const response = await fetch(`/api/admin/applications/${application.id}/post-call-zero/send`, {
        method: "POST"
      });
      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Impossible d'envoyer le pack de demarrage client.");
      }

      applyPacket({
        ...saveResult.packet,
        status: "sent"
      });
      setPostCallZeroState({
        status: "success",
        message: result.message || "Le pack de demarrage client a bien ete envoye."
      });
      router.refresh();
    } catch (error) {
      setPostCallZeroState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Impossible d'envoyer le pack de demarrage client."
      });
    }
  }

  return (
    <form className="admin-editor" onSubmit={handleSubmit}>
      {application?.drive_transfer_error ? (
        <section className="admin-panel admin-panel-warning">
          <div className="admin-system-warning">
            <small>Alerte Google Drive</small>
            <strong>Fichiers non transferes vers Google Drive</strong>
            <p>
              {application.drive_transfer_error}. L'inscription a bien ete enregistree, mais les fichiers n'ont pas
              ete envoyes dans Drive.
            </p>
          </div>
        </section>
      ) : null}

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <p className="eyebrow">Compte client</p>
            <h2>Etat du dossier et accompagnement</h2>
          </div>
          <a className="button button-dark" href={`${clientSpaceUrl}?admin_preview=1`}>
            Voir l'espace client
          </a>
        </div>

        <div className="admin-meta-grid">
          <div className="admin-subpanel">
            <small>Etat de l'acces</small>
            <strong>{access ? "Compte lie" : "Compte non lie"}</strong>
            <p className="admin-inline-note">
              {access
                ? "Le compte client est bien relie a ce dossier."
                : "Aucun lien compte/dossier n'a encore ete retrouve pour ce client."}
            </p>
          </div>

          <div className="admin-subpanel">
            <small>Deblocage de l'accompagnement</small>
            <strong>{buildSpaceStatusLabel(form.space_status)}</strong>
            <p className="admin-inline-note">
              {form.space_status === "active"
                ? "Le client voit les ressources reelles et l'accompagnement complet."
                : "Le client voit un espace en preparation et un appel a prise de rendez-vous."}
            </p>
          </div>

          <div className="admin-subpanel">
            <small>Derniere mise a jour</small>
            <strong>{formatAdminDate(application.updated_at)}</strong>
            <p className="admin-inline-note">Le dossier reste modifiable a tout moment depuis cet ecran.</p>
          </div>
        </div>

        <label className="admin-toggle-row" htmlFor="space-status-active">
          <div>
            <strong>Debloquer l'espace client</strong>
            <span>Active les ressources reelles apres l'appel et le plan d'accompagnement.</span>
          </div>
          <input
            id="space-status-active"
            type="checkbox"
            checked={form.space_status === "active"}
            onChange={(event) => updateField("space_status", event.target.checked ? "active" : "preparing")}
          />
        </label>

      </section>

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <p className="eyebrow">Identite</p>
            <h2>Profil client</h2>
          </div>
        </div>

        <div className="admin-meta-grid">
          <label className="auth-field">
            <span>Prenom</span>
            <input value={form.first_name} onChange={(event) => updateField("first_name", event.target.value)} />
          </label>
          <label className="auth-field">
            <span>Nom</span>
            <input value={form.last_name} onChange={(event) => updateField("last_name", event.target.value)} />
          </label>
          <label className="auth-field">
            <span>Pseudo</span>
            <input value={form.pseudo} onChange={(event) => updateField("pseudo", event.target.value)} />
          </label>
          <label className="auth-field">
            <span>Email</span>
            <input value={form.email} onChange={(event) => updateField("email", event.target.value)} />
          </label>
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <p className="eyebrow">Dossier client</p>
            <h2>Resume et informations</h2>
          </div>
        </div>

        <div className="admin-meta-grid">
          <label className="auth-field">
            <span>Type de demande</span>
            <input value={form.request_type} onChange={(event) => updateField("request_type", event.target.value)} />
          </label>
          <label className="auth-field">
            <span>Societe</span>
            <input value={form.company} onChange={(event) => updateField("company", event.target.value)} />
          </label>
          <label className="auth-field">
            <span>Pays</span>
            <input value={form.country} onChange={(event) => updateField("country", event.target.value)} />
          </label>
          <label className="auth-field">
            <span>Langue</span>
            <input value={form.language} onChange={(event) => updateField("language", event.target.value)} />
          </label>
        </div>

        <label className="auth-field">
          <span>Resume du dossier</span>
          <textarea
            className="admin-textarea"
            rows={6}
            value={form.message_rewritten}
            onChange={(event) => updateField("message_rewritten", event.target.value)}
          />
        </label>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <p className="eyebrow">Ressources</p>
            <h2>Liens et outils</h2>
          </div>
        </div>

        <div className="admin-meta-grid">
          <label className="auth-field">
            <span>Dossier Google Drive</span>
            <input
              value={form.drive_folder_url}
              onChange={(event) => updateField("drive_folder_url", event.target.value)}
            />
          </label>
          <label className="auth-field">
            <span>Lien Notion</span>
            <input value={form.notion_url} onChange={(event) => updateField("notion_url", event.target.value)} />
          </label>
        </div>

        <label className="admin-toggle-row" htmlFor="market-access-enabled">
          <div>
            <strong>Zero Limit Market</strong>
            <span>Afficher ou masquer le module market dans l'espace client.</span>
          </div>
          <input
            id="market-access-enabled"
            type="checkbox"
            checked={form.market_access_enabled}
            onChange={(event) => updateField("market_access_enabled", event.target.checked)}
          />
        </label>

        {form.drive_folder_url ? (
          <div className="admin-actions admin-actions-inline">
            <a className="button button-dark" href={form.drive_folder_url} target="_blank" rel="noreferrer">
              Ouvrir le dossier Drive
            </a>
          </div>
        ) : null}

        <div className="admin-stack">
          {form.resource_links.map((resource, index) => (
            <div key={`resource-${index}`} className="admin-subpanel">
              <div className="admin-panel-heading admin-panel-heading-tight">
                <div>
                  <small>Outil {index + 1}</small>
                </div>
                {form.resource_links.length > 1 ? (
                  <button
                    className="button button-dark button-compact"
                    type="button"
                    onClick={() => removeResource(index)}
                  >
                    Supprimer
                  </button>
                ) : null}
              </div>

              <div className="admin-subpanel-grid">
                <label className="auth-field">
                  <span>Nom de l'outil</span>
                  <input
                    value={resource.name}
                    onChange={(event) => updateArrayField("resource_links", index, "name", event.target.value)}
                  />
                </label>
                <label className="auth-field">
                  <span>Categorie</span>
                  <input
                    value={resource.kind}
                    onChange={(event) => updateArrayField("resource_links", index, "kind", event.target.value)}
                  />
                </label>
                <label className="auth-field">
                  <span>Lien</span>
                  <input
                    value={resource.url}
                    onChange={(event) => updateArrayField("resource_links", index, "url", event.target.value)}
                  />
                </label>
                <label className="auth-field">
                  <span>Logo (URL, optionnel)</span>
                  <input
                    value={resource.logo_url}
                    onChange={(event) => updateArrayField("resource_links", index, "logo_url", event.target.value)}
                  />
                </label>
              </div>

              <label className="auth-field">
                <span>Description</span>
                <textarea
                  className="admin-textarea admin-textarea-compact"
                  rows={3}
                  value={resource.description}
                  onChange={(event) =>
                    updateArrayField("resource_links", index, "description", event.target.value)
                  }
                />
              </label>
            </div>
          ))}
        </div>

        <button className="button button-dark" type="button" onClick={addResource}>
          Ajouter un outil
        </button>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <p className="eyebrow">Pack de demarrage client</p>
            <h2>Preparation du pack</h2>
          </div>
        </div>

        <p className="admin-inline-note">
          Ce pack reste separe de l'espace client. Les documents sont envoyes en pieces jointes, puis les acces utiles
          sont synchronises dans le dossier client apres l'envoi.
        </p>

        <div className="admin-stack admin-stack-tight">
          <div className="admin-subpanel">
            <div className="admin-panel-heading admin-panel-heading-tight">
              <div>
                <small>Section 1</small>
                <h3>Resume</h3>
              </div>
              <span className="admin-status-pill">
                {packetForm.status === "sent" ? "Pack envoye" : "Brouillon"}
              </span>
            </div>

            <label className="auth-field">
              <span>Resume personnalise</span>
              <textarea
                className="admin-textarea"
                rows={6}
                value={packetForm.summary_message}
                onChange={(event) => updatePacketField("summary_message", event.target.value)}
              />
            </label>
          </div>

          <div className="admin-subpanel">
            <div className="admin-panel-heading admin-panel-heading-tight">
              <div>
                <small>Section 2</small>
                <h3>Paiement</h3>
              </div>
            </div>

            <div className="admin-meta-grid">
              <label className="auth-field">
                <span>Statut du pack</span>
                <select
                  className="admin-select"
                  value={packetForm.status}
                  onChange={(event) => updatePacketField("status", event.target.value)}
                >
                  <option value="draft">Brouillon</option>
                  <option value="sent">Deja envoye</option>
                </select>
              </label>
              <label className="auth-field">
                <span>Lien paiement Stripe</span>
                <input
                  value={packetForm.payment_url}
                  onChange={(event) => updatePacketField("payment_url", event.target.value)}
                />
              </label>
            </div>
          </div>

          <div className="admin-subpanel">
            <div className="admin-panel-heading admin-panel-heading-tight">
              <div>
                <small>Section 3</small>
                <h3>Documents</h3>
              </div>
            </div>

            <div className="admin-packet-documents-grid">
              <label className="auth-field admin-file-card">
                <span>Devis (PDF)</span>
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(event) => updatePacketFile("quote_file", event.target.files?.[0] || null)}
                />
                <small>{packetFiles.quote_file?.name || packetForm.quote_file_name || "Aucun fichier ajoute"}</small>
              </label>

              <label className="auth-field admin-file-card">
                <span>Contrat (PDF)</span>
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(event) => updatePacketFile("contract_file", event.target.files?.[0] || null)}
                />
                <small>
                  {packetFiles.contract_file?.name || packetForm.contract_file_name || "Aucun fichier ajoute"}
                </small>
              </label>

              <label className="auth-field admin-file-card">
                <span>Dossier de bienvenue (PDF ou ZIP)</span>
                <input
                  type="file"
                  accept="application/pdf,.pdf,.zip,application/zip,application/x-zip-compressed"
                  onChange={(event) => updatePacketFile("welcome_file", event.target.files?.[0] || null)}
                />
                <small>
                  {packetFiles.welcome_file?.name || packetForm.welcome_file_name || "Aucun fichier ajoute"}
                </small>
              </label>
            </div>
          </div>

          <div className="admin-subpanel">
            <div className="admin-panel-heading admin-panel-heading-tight">
              <div>
                <small>Section 4</small>
                <h3>Liens utiles</h3>
              </div>
            </div>

            <div className="admin-packet-links-grid">
              <div className="admin-link-card">
                <small>Google Drive</small>
                <strong>{form.drive_folder_url ? "Lien disponible" : "Aucun lien ajoute"}</strong>
                {form.drive_folder_url ? (
                  <a className="button button-dark button-compact" href={form.drive_folder_url} target="_blank" rel="noreferrer">
                    Ouvrir Drive
                  </a>
                ) : null}
              </div>
              <div className="admin-link-card">
                <small>Notion</small>
                <strong>{form.notion_url ? "Lien disponible" : "Aucun lien ajoute"}</strong>
                {form.notion_url ? (
                  <a className="button button-dark button-compact" href={form.notion_url} target="_blank" rel="noreferrer">
                    Ouvrir Notion
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="admin-actions admin-actions-inline">
          <button
            className="button button-dark"
            type="button"
            onClick={handleSavePostCallZeroPacket}
            disabled={postCallZeroState.status === "loading"}
          >
            {postCallZeroState.status === "loading" ? "Enregistrement..." : "Enregistrer"}
          </button>
          <button
            className="button button-primary"
            type="button"
            onClick={handleSendPostCallZeroEmail}
            disabled={postCallZeroState.status === "loading"}
          >
            {postCallZeroState.status === "loading"
              ? "Envoi en cours..."
              : "Envoyer le pack de demarrage"}
          </button>
        </div>

        {postCallZeroState.message ? (
          <p
            className={`auth-feedback ${
              postCallZeroState.status === "error"
                ? "auth-feedback-error"
                : postCallZeroState.status === "success"
                  ? "auth-feedback-success"
                  : ""
            }`}
          >
            {postCallZeroState.message}
          </p>
        ) : null}
      </section>

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <p className="eyebrow">Timeline</p>
            <h2>Etapes du projet</h2>
          </div>
        </div>

        <div className="admin-stack">
          {form.timeline_events.map((eventItem, index) => (
            <div key={`timeline-${index}`} className="admin-subpanel">
              <div className="admin-panel-heading admin-panel-heading-tight">
                <div>
                  <small>Etape {index + 1}</small>
                </div>
                {form.timeline_events.length > 1 ? (
                  <button
                    className="button button-dark button-compact"
                    type="button"
                    onClick={() => removeTimelineEvent(index)}
                  >
                    Supprimer
                  </button>
                ) : null}
              </div>

              <div className="admin-subpanel-grid">
                <label className="auth-field">
                  <span>Etape</span>
                  <input
                    value={eventItem.label}
                    onChange={(event) => updateArrayField("timeline_events", index, "label", event.target.value)}
                  />
                </label>
                <label className="auth-field">
                  <span>Date ou repere</span>
                  <input
                    value={eventItem.date}
                    onChange={(event) => updateArrayField("timeline_events", index, "date", event.target.value)}
                  />
                </label>
                <label className="auth-field">
                  <span>Etat visuel</span>
                  <select
                    className="admin-select"
                    value={eventItem.tone}
                    onChange={(event) => updateArrayField("timeline_events", index, "tone", event.target.value)}
                  >
                    <option value="done">Terminee</option>
                    <option value="current">En cours</option>
                    <option value="upcoming">A venir</option>
                  </select>
                </label>
              </div>

              <label className="auth-field">
                <span>Description</span>
                <textarea
                  className="admin-textarea admin-textarea-compact"
                  rows={3}
                  value={eventItem.description}
                  onChange={(event) =>
                    updateArrayField("timeline_events", index, "description", event.target.value)
                  }
                />
              </label>
            </div>
          ))}
        </div>

        <button className="button button-dark" type="button" onClick={addTimelineEvent}>
          Ajouter une etape
        </button>
      </section>

      <div className="admin-actions">
        <button className="button button-primary" type="submit" disabled={state.status === "loading"}>
          {state.status === "loading" ? "Enregistrement..." : "Enregistrer les modifications"}
        </button>
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

      <section className="admin-panel admin-panel-danger">
        <div className="admin-panel-heading">
          <div>
            <p className="eyebrow">Zone sensible</p>
            <h2>Suppression definitive</h2>
          </div>
        </div>

        <DeleteApplicationButton applicationId={application.id} />
      </section>
    </form>
  );
}
