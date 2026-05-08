"use client";

import { useState } from "react";

export function NewsletterPreferences({
  applicationId,
  initialSubscribed = false,
  disabled = false
}) {
  const [subscribed, setSubscribed] = useState(Boolean(initialSubscribed));
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  async function handleToggle(nextSubscribed) {
    if (disabled || pending) {
      return;
    }

    setPending(true);
    setFeedback("");
    setError("");

    try {
      const response = await fetch(`/api/client/newsletter/${applicationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          subscribed: nextSubscribed
        })
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || "Impossible de mettre à jour la newsletter.");
      }

      setSubscribed(Boolean(payload.subscribed));
      setFeedback(
        payload.subscribed
          ? "Vous êtes bien inscrit à la newsletter."
          : "Vous êtes bien désinscrit de la newsletter."
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Impossible de mettre à jour la newsletter."
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <article className="client-panel client-panel-newsletter">
      <div className="client-panel-heading">
        <p className="eyebrow">Newsletter</p>
        <h2>Préférences de communication</h2>
      </div>

      <p className="client-panel-note">
        Gérez ici votre inscription aux nouvelles et mises à jour envoyées par Zero Limit Agency.
      </p>

      <div className="client-newsletter-status">
        <strong>{subscribed ? "Newsletter activée" : "Newsletter désactivée"}</strong>
        <span>
          {subscribed
            ? "Vous recevez actuellement les actualités et informations utiles."
            : "Vous ne recevez plus la newsletter marketing."}
        </span>
      </div>

      <div className="client-newsletter-actions">
        {subscribed ? (
          <button
            type="button"
            className="button button-dark"
            onClick={() => handleToggle(false)}
            disabled={pending}
          >
            {pending ? "Mise à jour..." : "Se désinscrire"}
          </button>
        ) : (
          <button
            type="button"
            className="button button-primary"
            onClick={() => handleToggle(true)}
            disabled={pending}
          >
            {pending ? "Mise à jour..." : "Se réinscrire"}
          </button>
        )}
      </div>

      {feedback ? <p className="client-inline-feedback">{feedback}</p> : null}
      {error ? <p className="client-inline-error">{error}</p> : null}
    </article>
  );
}
