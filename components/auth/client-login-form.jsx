"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ClientLoginForm() {
  const router = useRouter();
  const [state, setState] = useState({
    status: "idle",
    message: ""
  });
  const [forgotState, setForgotState] = useState({
    status: "idle",
    message: ""
  });
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  async function submitLogin(payload, loadingMessage) {
    setForgotState({
      status: "idle",
      message: ""
    });
    setState({
      status: "loading",
      message: loadingMessage
    });

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Connexion impossible.");
      }

      setState({
        status: "success",
        message: "Connexion réussie. Redirection vers votre espace..."
      });

      router.push(result.redirectTo || "/espace-client");
      router.refresh();
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "Connexion impossible."
      });
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      email: String(data.get("email") || "").trim().toLowerCase(),
      password: String(data.get("password") || "").trim(),
      website: String(data.get("website") || "").trim()
    };

    await submitLogin(payload, "Connexion en cours...");
  }

  function handleDemoAccess() {
    setForgotState({
      status: "idle",
      message: ""
    });
    setState({
      status: "success",
      message: "Ouverture de la démonstration..."
    });

    router.push("/espace-client/demo");
    router.refresh();
  }

  async function handleForgotPassword(event) {
    event.preventDefault();

    const form = event.currentTarget.closest("form");
    const emailInput = form?.querySelector('input[name="email"]');
    const email = String(emailInput?.value || "").trim().toLowerCase();

    setState({
      status: "idle",
      message: ""
    });
    setForgotState({
      status: "loading",
      message: "Envoi du lien de réinitialisation..."
    });

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
      });
      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        throw new Error(
          result?.error || "Impossible d'envoyer un nouveau lien de réinitialisation."
        );
      }

      setForgotState({
        status: "success",
        message: result.message
      });
    } catch (error) {
      setForgotState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Impossible d'envoyer un nouveau lien de réinitialisation."
      });
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <input
        name="website"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        className="honeypot-field"
        aria-hidden="true"
      />
      <label className="auth-field">
        <span>Adresse email</span>
        <input name="email" type="email" autoComplete="email" required />
      </label>

      <label className="auth-field">
        <span>Mot de passe</span>
        <span className="password-input-wrap">
          <input
            name="password"
            type={isPasswordVisible ? "text" : "password"}
            autoComplete="current-password"
            required
          />
          <button
            className="password-visibility-toggle"
            type="button"
            onClick={() => setIsPasswordVisible((current) => !current)}
            aria-label={
              isPasswordVisible
                ? "Masquer le mot de passe"
                : "Prévisualiser le mot de passe"
            }
            aria-pressed={isPasswordVisible}
          >
            <svg
              className="password-eye"
              viewBox="0 0 24 24"
              aria-hidden="true"
              focusable="false"
            >
              <path
                className="password-eye-outline"
                d="M2.8 12s3.4-5.2 9.2-5.2S21.2 12 21.2 12s-3.4 5.2-9.2 5.2S2.8 12 2.8 12Z"
              />
              <circle className="password-eye-pupil" cx="12" cy="12" r="2.6" />
            </svg>
          </button>
        </span>
      </label>

      <button className="button button-primary" type="submit" disabled={state.status === "loading"}>
        {state.status === "loading" ? "Connexion..." : "Se connecter"}
      </button>

      <button
        className="auth-inline-link"
        type="button"
        onClick={handleForgotPassword}
        disabled={state.status === "loading" || forgotState.status === "loading"}
      >
        {forgotState.status === "loading" ? "Envoi du lien..." : "Mot de passe oublié ?"}
      </button>

      {forgotState.message ? (
        <p
          className={`auth-feedback ${
            forgotState.status === "error"
              ? "auth-feedback-error"
              : forgotState.status === "success"
                ? "auth-feedback-success"
                : ""
          }`}
        >
          {forgotState.message}
        </p>
      ) : null}

      <div className="auth-demo-panel">
        <strong>Découvrir l'espace client</strong>
        <p>Ouvrez une démonstration fictive pour visualiser le tableau de bord, les ressources et le suivi.</p>
        <button
          className="button button-dark"
          type="button"
          onClick={handleDemoAccess}
          disabled={state.status === "loading" || forgotState.status === "loading"}
        >
          Voir la démonstration
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
    </form>
  );
}
