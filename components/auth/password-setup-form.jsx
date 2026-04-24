"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

function readTokenValue(searchParams, hashParams, key) {
  return (
    String(searchParams.get(key) || "").trim() ||
    String(hashParams.get(key) || "").trim()
  );
}

export function PasswordSetupForm() {
  const router = useRouter();
  const [tokens, setTokens] = useState({
    accessToken: "",
    refreshToken: "",
    type: ""
  });
  const [form, setForm] = useState({
    password: "",
    confirmPassword: ""
  });
  const [state, setState] = useState({
    status: "idle",
    message: ""
  });

  const passwordStrength =
    form.password.length >= 12
      ? "strong"
      : form.password.length >= 8
        ? "medium"
        : form.password.length > 0
          ? "weak"
          : "idle";

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));

    setTokens({
      accessToken: readTokenValue(searchParams, hashParams, "access_token"),
      refreshToken: readTokenValue(searchParams, hashParams, "refresh_token"),
      type: readTokenValue(searchParams, hashParams, "type")
    });
  }, []);

  const hasUsableLink = useMemo(
    () => Boolean(tokens.accessToken && tokens.refreshToken),
    [tokens.accessToken, tokens.refreshToken]
  );

  async function handleSubmit(event) {
    event.preventDefault();

    if (form.password.length < 8) {
      setState({
        status: "error",
        message: "Le mot de passe doit contenir au moins 8 caractères."
      });
      return;
    }

    if (form.password !== form.confirmPassword) {
      setState({
        status: "error",
        message: "Les deux mots de passe ne correspondent pas."
      });
      return;
    }

    setState({
      status: "loading",
      message: "Activation de votre accès en cours..."
    });

    try {
      const response = await fetch("/api/auth/password-setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          password: form.password
        })
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        throw new Error(
          result?.error ||
            "Impossible de finaliser votre accès client pour le moment."
        );
      }

      setState({
        status: "success",
        message: "Votre mot de passe est enregistré. Redirection vers votre espace..."
      });

      router.push(result.redirectTo || "/espace-client");
      router.refresh();
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Impossible de finaliser votre accès client."
      });
    }
  }

  if (!hasUsableLink) {
    return (
      <div className="auth-form">
        <p className="auth-feedback auth-feedback-error">
          Le lien d'activation est manquant, incomplet ou expiré. Revenez vers Zero Limit Agency
          pour recevoir un nouvel email d'accès.
        </p>
      </div>
    );
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="auth-copy-note auth-copy-note-compact">
        <strong>Avant de commencer</strong>
        <p>
          Utilisez un mot de passe personnel, avec au moins 8 caractères. Une fois validé, votre
          espace client sera ouvert automatiquement.
        </p>
      </div>

      <label className="auth-field">
        <span>Nouveau mot de passe</span>
        <input
          type="password"
          autoComplete="new-password"
          required
          value={form.password}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              password: event.target.value
            }))
          }
        />
      </label>

      <div className="password-strength" data-strength={passwordStrength}>
        <span />
        <span />
        <span />
      </div>

      <p className="auth-helper">
        Conseil : privilégiez une phrase de passe ou un mot de passe long, facile à retenir et
        difficile à deviner.
      </p>

      <label className="auth-field">
        <span>Confirmer le mot de passe</span>
        <input
          type="password"
          autoComplete="new-password"
          required
          value={form.confirmPassword}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              confirmPassword: event.target.value
            }))
          }
        />
      </label>

      <button className="button button-primary" type="submit" disabled={state.status === "loading"}>
        {state.status === "loading" ? "Activation..." : "Définir mon mot de passe"}
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

      {tokens.type ? <p className="auth-helper">Type de lien détecté : {tokens.type}</p> : null}
    </form>
  );
}
