"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CONFIRMATION_MESSAGE =
  "Cette action supprimera la demande, le profil client, l'acces client et le compte de connexion associe. Action irreversible.";

export function DeleteApplicationButton({ applicationId, variant = "default" }) {
  const router = useRouter();
  const [state, setState] = useState({
    status: "idle",
    message: ""
  });

  async function handleDelete() {
    const confirmed = window.confirm(CONFIRMATION_MESSAGE);

    if (!confirmed) {
      return;
    }

    setState({
      status: "loading",
      message: "Suppression definitive du dossier en cours..."
    });

    try {
      const response = await fetch(`/api/admin/applications/${applicationId}`, {
        method: "DELETE"
      });
      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Impossible de supprimer definitivement ce dossier.");
      }

      setState({
        status: "success",
        message: result.message || "Le dossier a bien ete supprime definitivement."
      });

      window.setTimeout(() => {
        router.push("/admin");
        router.refresh();
      }, 500);
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Impossible de supprimer definitivement ce dossier."
      });
    }
  }

  return (
    <div className={`admin-danger-zone${variant === "rejected" ? " admin-danger-zone-highlight" : ""}`}>
      <div className="admin-danger-copy">
        <small>Suppression definitive</small>
        <strong>Supprimer definitivement</strong>
        <p>
          Cette action supprimera la demande, le profil client, l'acces client et le compte de connexion associe.
          Action irreversible.
        </p>
      </div>

      <div className="admin-danger-actions">
        <button
          className="button button-danger"
          type="button"
          onClick={handleDelete}
          disabled={state.status === "loading"}
        >
          {state.status === "loading" ? "Suppression..." : "Supprimer definitivement"}
        </button>

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
      </div>
    </div>
  );
}
