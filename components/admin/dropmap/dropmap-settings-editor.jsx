"use client";

import { useState } from "react";

const MODE_OPTIONS = [
  {
    value: "private",
    label: "Privé",
    description:
      "DropMap est invisible publiquement. Les visiteurs et clients sont redirigés vers l'accueil. Seuls les administrateurs voient la preview."
  },
  {
    value: "maintenance",
    label: "Maintenance",
    description:
      "Les visiteurs voient uniquement une page de maintenance. Les administrateurs gardent accès à la preview."
  },
  {
    value: "public",
    label: "Public",
    description:
      "La page DropMap devient visible publiquement. Cela ne donne pas automatiquement accès aux futures fonctions payantes."
  }
];

const DEFAULT_MESSAGE =
  "DropMap est temporairement indisponible. Notre équipe effectue actuellement une opération de maintenance. Veuillez réessayer ultérieurement.";

function normalizeInitialSettings(settings) {
  const mode = MODE_OPTIONS.some((option) => option.value === settings?.visibilityMode)
    ? settings.visibilityMode
    : "private";

  return {
    visibilityMode: mode,
    maintenanceMessage: String(settings?.maintenanceMessage || DEFAULT_MESSAGE)
  };
}

export function DropMapSettingsEditor({ initialSettings }) {
  const [form, setForm] = useState(() => normalizeInitialSettings(initialSettings));
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
      message: "Enregistrement des réglages DropMap en cours..."
    });

    try {
      const response = await fetch("/api/admin/dropmap/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });
      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Impossible de mettre à jour les réglages DropMap.");
      }

      setForm(normalizeInitialSettings(result.settings || form));
      setState({
        status: "success",
        message: result.message || "Les réglages DropMap ont bien été mis à jour."
      });
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "Impossible de mettre à jour les réglages DropMap."
      });
    }
  }

  const selectedOption = MODE_OPTIONS.find((option) => option.value === form.visibilityMode) || MODE_OPTIONS[0];

  return (
    <section className="admin-panel">
      <div className="admin-panel-heading">
        <div>
          <p className="eyebrow">DropMap</p>
          <h2>Visibilité confidentielle</h2>
          <p className="admin-inline-note">
            Cette configuration contrôle uniquement la découverte de /dropmap. Les futurs accès payants resteront séparés.
          </p>
        </div>
      </div>

      <div className="admin-overview-grid">
        <article className="admin-subpanel">
          <small>Mode actuel</small>
          <strong>{selectedOption.label}</strong>
          <p className="admin-inline-note">En cas d'erreur ou de doute, DropMap revient toujours en mode privé.</p>
        </article>
        <article className="admin-subpanel">
          <small>Preview admin</small>
          <strong>Autorisée</strong>
          <p className="admin-inline-note">Les administrateurs gardent accès à la preview dans les trois modes.</p>
        </article>
      </div>

      <div className="admin-meta-grid">
        <div className="auth-field admin-field-full">
          <span>Mode de visibilité</span>
          <div className="admin-overview-grid">
            {MODE_OPTIONS.map((option) => (
              <button
                key={option.value}
                className={`admin-filter-chip${form.visibilityMode === option.value ? " is-active" : ""}`}
                type="button"
                aria-pressed={form.visibilityMode === option.value}
                onClick={() => updateField("visibilityMode", option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="admin-inline-note">{selectedOption.description}</p>
        </div>

        <label className="auth-field admin-field-full">
          <span>Message de maintenance DropMap</span>
          <textarea
            className="admin-textarea"
            rows={4}
            maxLength={320}
            value={form.maintenanceMessage}
            onChange={(event) => updateField("maintenanceMessage", event.target.value)}
          />
        </label>
      </div>

      <div className="admin-empty-state">
        <strong>Rappel sécurité</strong>
        <p>
          Le mode privé redirige visiteurs, clients et mode démo vers l'accueil sans rendre de contenu DropMap. Les endpoints futurs devront réutiliser le garde de visibilité serveur.
        </p>
      </div>

      <div className="admin-actions">
        <a className="button button-dark" href="/dropmap" target="_blank" rel="noreferrer">
          Prévisualiser /dropmap
        </a>
        <button className="button button-primary" type="button" onClick={handleSave} disabled={state.status === "loading"}>
          {state.status === "loading" ? "Enregistrement..." : "Enregistrer les réglages DropMap"}
        </button>
        {state.message ? <p className={`form-note form-note-${state.status}`}>{state.message}</p> : null}
      </div>
    </section>
  );
}
