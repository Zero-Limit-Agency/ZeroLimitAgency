"use client";

import { useState } from "react";

import { DEFAULT_MAINTENANCE_SETTINGS, normalizeMaintenanceSettings } from "@/lib/maintenance";

export function MaintenanceModeEditor({ initialSettings = DEFAULT_MAINTENANCE_SETTINGS }) {
  const [form, setForm] = useState(() => normalizeMaintenanceSettings(initialSettings));
  const [state, setState] = useState({ status: "idle", message: "" });

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  async function handleSave() {
    setState({
      status: "loading",
      message: "Enregistrement du mode maintenance en cours..."
    });

    try {
      const response = await fetch("/api/admin/maintenance", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Impossible de mettre à jour le mode maintenance.");
      }

      const nextSettings = normalizeMaintenanceSettings(result.settings || form);
      setForm(nextSettings);
      setState({
        status: "success",
        message: result.message || "Le mode maintenance a bien été mis à jour."
      });
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "Impossible de mettre à jour le mode maintenance."
      });
    }
  }

  return (
    <section className="admin-panel">
      <div className="admin-panel-heading">
        <div>
          <p className="eyebrow">Maintenance</p>
          <h2>Mode maintenance</h2>
          <p className="admin-inline-note">
            Le site public affiche un écran de maintenance, mais l'administration continue de fonctionner.
          </p>
        </div>
      </div>

      <div className="admin-overview-grid">
        <article className="admin-subpanel">
          <small>État</small>
          <strong>{form.enabled ? "Activé" : "Désactivé"}</strong>
          <p className="admin-inline-note">
            Les pages admin restent accessibles dans les deux cas.
          </p>
        </article>
        <article className="admin-subpanel">
          <small>Accès admin</small>
          <strong>Conservé</strong>
          <p className="admin-inline-note">
            Un lien discret vers la connexion admin reste disponible sur l'écran maintenance.
          </p>
        </article>
      </div>

      <div className="admin-meta-grid">
        <label className="auth-field admin-toggle-field">
          <span>Activer le mode maintenance</span>
          <button
            className={`admin-toggle-switch${form.enabled ? " is-active" : ""}`}
            type="button"
            aria-pressed={form.enabled}
            onClick={() => updateField("enabled", !form.enabled)}
          >
            <span />
          </button>
        </label>

        <label className="auth-field admin-field-full">
          <span>Titre</span>
          <input value={form.title} onChange={(event) => updateField("title", event.target.value)} />
        </label>

        <label className="auth-field admin-field-full">
          <span>Message principal</span>
          <textarea
            className="admin-textarea"
            rows={4}
            value={form.message}
            onChange={(event) => updateField("message", event.target.value)}
          />
        </label>

        <label className="auth-field admin-field-full">
          <span>Note secondaire</span>
          <input value={form.note} onChange={(event) => updateField("note", event.target.value)} />
        </label>
      </div>

      <div className="admin-actions">
        <button className="button button-primary" type="button" onClick={handleSave} disabled={state.status === "loading"}>
          {state.status === "loading" ? "Enregistrement..." : "Enregistrer le mode maintenance"}
        </button>
        {state.message ? <p className={`form-note form-note-${state.status}`}>{state.message}</p> : null}
      </div>
    </section>
  );
}
