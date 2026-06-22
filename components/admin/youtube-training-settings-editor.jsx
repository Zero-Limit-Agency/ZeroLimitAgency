"use client";

import { useState } from "react";

import { normalizeYoutubeTrainingSettings } from "@/lib/learn-youtube/settings-shared";

const MODE_OPTIONS = [
  {
    value: "private",
    label: "Privée",
    description: "Preview administrateur uniquement. Les visiteurs et clients sont redirigés vers l'accueil."
  },
  {
    value: "public",
    label: "Publique",
    description: "La page /learn-youtube est accessible au public, sans accorder d'accès aux futurs contenus payants."
  },
  {
    value: "maintenance",
    label: "Maintenance",
    description: "Une maintenance dédiée Formation YouTube s'affiche au public. Les administrateurs gardent la preview."
  }
];

export function YoutubeTrainingSettingsEditor({ initialSettings }) {
  const [form, setForm] = useState(() => normalizeYoutubeTrainingSettings(initialSettings));
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
      message: "Enregistrement des réglages Formation YouTube en cours..."
    });

    try {
      const response = await fetch("/api/admin/learn-youtube/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });
      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Impossible de mettre à jour les réglages Formation YouTube.");
      }

      const nextSettings = normalizeYoutubeTrainingSettings(result.settings || form);
      setForm(nextSettings);
      setState({
        status: "success",
        message: result.message || "Les réglages Formation YouTube ont bien été mis à jour."
      });
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "Impossible de mettre à jour les réglages Formation YouTube."
      });
    }
  }

  return (
    <section className="admin-panel">
      <div className="admin-panel-heading">
        <div>
          <p className="eyebrow">Formation YouTube</p>
          <h2>Disponibilité et bouton futur</h2>
          <p className="admin-inline-note">
            Ces réglages pilotent uniquement la fondation /learn-youtube. Ils sont indépendants de la maintenance du site principal.
          </p>
        </div>
      </div>

      <div className="admin-overview-grid">
        <article className="admin-subpanel">
          <small>Disponibilité</small>
          <strong>{MODE_OPTIONS.find((option) => option.value === form.mode)?.label || "Privée"}</strong>
          <p className="admin-inline-note">Le mode privé reste la valeur de sécurité par défaut.</p>
        </article>
        <article className="admin-subpanel">
          <small>Bouton Formation YouTube</small>
          <strong>{form.cta_visible ? "Visible" : "Masqué"}</strong>
          <p className="admin-inline-note">Ce réglage n'ajoute encore aucun bouton et n'accorde aucun droit d'accès.</p>
        </article>
      </div>

      <div className="admin-meta-grid">
        <div className="auth-field admin-field-full">
          <span>Disponibilité</span>
          <div className="admin-overview-grid">
            {MODE_OPTIONS.map((option) => (
              <button
                key={option.value}
                className={`admin-filter-chip${form.mode === option.value ? " is-active" : ""}`}
                type="button"
                aria-pressed={form.mode === option.value}
                onClick={() => updateField("mode", option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="admin-inline-note">
            {MODE_OPTIONS.find((option) => option.value === form.mode)?.description}
          </p>
        </div>

        <label className="auth-field admin-field-full">
          <span>Message de maintenance Formation YouTube</span>
          <textarea
            className="admin-textarea"
            rows={3}
            maxLength={240}
            value={form.maintenance_message}
            onChange={(event) => updateField("maintenance_message", event.target.value)}
          />
        </label>

        <label className="auth-field admin-toggle-field">
          <span>Bouton Formation YouTube visible plus tard</span>
          <button
            className={`admin-toggle-switch${form.cta_visible ? " is-active" : ""}`}
            type="button"
            aria-pressed={form.cta_visible}
            onClick={() => updateField("cta_visible", !form.cta_visible)}
          >
            <span />
          </button>
        </label>
      </div>

      <div className="admin-empty-state">
        <strong>Rappel sécurité</strong>
        <p>
          Masquer le bouton ne bloque pas /learn-youtube. Afficher le bouton n'accorde aucun accès. La sécurité reste assurée par les contrôles serveur du layout Formation YouTube.
        </p>
      </div>

      <div className="admin-actions">
        <a className="button button-dark" href="/learn-youtube" target="_blank" rel="noreferrer">
          Prévisualiser /learn-youtube
        </a>
        <button className="button button-primary" type="button" onClick={handleSave} disabled={state.status === "loading"}>
          {state.status === "loading" ? "Enregistrement..." : "Enregistrer les réglages Formation YouTube"}
        </button>
        {state.message ? <p className={`form-note form-note-${state.status}`}>{state.message}</p> : null}
      </div>
    </section>
  );
}
