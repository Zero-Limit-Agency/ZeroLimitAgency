"use client";

import { useState } from "react";

import styles from "./dropmap-admin.module.css";

const MODE_OPTIONS = [
  {
    value: "private",
    label: "Privé",
    description:
      "Invisible publiquement. Visiteurs et clients redirigés vers l'accueil. Preview administrateur uniquement."
  },
  {
    value: "maintenance",
    label: "Maintenance",
    description:
      "Page de maintenance pour le public. Preview complète pour les administrateurs."
  },
  {
    value: "public",
    label: "Public",
    description:
      "Page visible publiquement. Cela ne donne pas automatiquement accès aux futures fonctions payantes."
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
    <section className={styles.panel}>
      <div className={styles.panelHeading}>
        <div>
          <p className={styles.eyebrow}>DropMap</p>
          <h2>Visibilité confidentielle</h2>
          <p className={styles.note}>
            Cette console pilote uniquement la visibilité de /dropmap. Elle ne publie aucun moteur, aucune offre et aucune donnée sensible.
          </p>
        </div>
      </div>

      <div className={styles.overviewGrid}>
        <article className={styles.subpanel}>
          <small>Mode actuel</small>
          <strong>{selectedOption.label}</strong>
          <p className={styles.note}>En cas d'erreur ou de doute, DropMap revient toujours en mode privé.</p>
        </article>
        <article className={styles.subpanel}>
          <small>Preview admin</small>
          <strong>Autorisée</strong>
          <p className={styles.note}>Les administrateurs gardent accès à la preview dans les trois modes.</p>
        </article>
      </div>

      <div className={styles.metaGrid}>
        <div className={styles.field}>
          <span>Mode de visibilité</span>
          <div className={styles.modeGrid}>
            {MODE_OPTIONS.map((option) => (
              <button
                key={option.value}
                className={`${styles.modeButton}${form.visibilityMode === option.value ? ` ${styles.modeButtonActive}` : ""}`}
                type="button"
                aria-pressed={form.visibilityMode === option.value}
                onClick={() => updateField("visibilityMode", option.value)}
              >
                <strong>{option.label}</strong>
                <span>{option.description}</span>
              </button>
            ))}
          </div>
          <p className={styles.note}>Mode sélectionné : {selectedOption.description}</p>
        </div>

        <label className={styles.field}>
          <span>Message de maintenance DropMap</span>
          <textarea
            className={styles.textarea}
            rows={4}
            maxLength={320}
            value={form.maintenanceMessage}
            onChange={(event) => updateField("maintenanceMessage", event.target.value)}
          />
        </label>
      </div>

      <div className={styles.emptyState}>
        <strong>Rappel sécurité</strong>
        <p>
          Le mode privé redirige visiteurs, clients et mode démo vers l'accueil sans rendre de contenu DropMap. Le doute, l'erreur serveur ou une configuration absente doivent rester interprétés comme privé.
        </p>
      </div>

      <div className={styles.actions}>
        <a className={styles.button} href="/dropmap" target="_blank" rel="noreferrer">
          Prévisualiser /dropmap
        </a>
        <button className={`${styles.button} ${styles.buttonPrimary}`} type="button" onClick={handleSave} disabled={state.status === "loading"}>
          {state.status === "loading" ? "Enregistrement..." : "Enregistrer les réglages DropMap"}
        </button>
        {state.message ? <p className={`${styles.formNote} ${state.status === "success" ? styles.formNoteSuccess : ""} ${state.status === "error" ? styles.formNoteError : ""}`}>{state.message}</p> : null}
      </div>
    </section>
  );
}
