"use client";

import { useState } from "react";

import { normalizeSupportSettings } from "@/lib/site-content";

export function SupportChannelsEditor({ initialSettings }) {
  const [form, setForm] = useState(() => normalizeSupportSettings(initialSettings));
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
      message: "Enregistrement des canaux de support..."
    });

    try {
      const response = await fetch("/api/admin/support-channels", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });
      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Impossible d'enregistrer les canaux de support.");
      }

      setForm(normalizeSupportSettings(result.support || form));
      setState({
        status: "success",
        message: result.message || "Les canaux de support ont bien ete enregistres."
      });
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof Error ? error.message : "Impossible d'enregistrer les canaux de support."
      });
    }
  }

  return (
    <section className="admin-panel">
      <div className="admin-panel-heading">
        <div>
          <p className="eyebrow">Support client</p>
          <h2>Canaux de contact</h2>
          <p className="admin-inline-note">
            Ces liens sont utilises dans les espaces contact, collaboration et partenariat.
          </p>
        </div>
      </div>

      <div className="admin-meta-grid">
        <label className="auth-field">
          <span>Email de contact</span>
          <input
            value={form.contactEmail}
            onChange={(event) => updateField("contactEmail", event.target.value)}
            placeholder="contact@zerolimit.agency"
          />
        </label>

        <label className="auth-field">
          <span>URL Discord</span>
          <input
            value={form.discordUrl}
            onChange={(event) => updateField("discordUrl", event.target.value)}
            placeholder="https://discord.gg/..."
          />
        </label>
      </div>

      <div className="admin-actions">
        <button className="button button-primary" type="button" onClick={handleSave} disabled={state.status === "loading"}>
          {state.status === "loading" ? "Enregistrement..." : "Enregistrer les canaux"}
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
    </section>
  );
}
