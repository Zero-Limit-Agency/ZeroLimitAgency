"use client";

import { requestCoreJson } from "@/lib/http/core-request";

import Link from "next/link";
import { useState } from "react";
import { PasswordField } from "@/components/identity/password-field";

export function ForgotPasswordForm() {
  const [state, setState] = useState({ status: "idle", message: "" });
  async function submit(event) {
    event.preventDefault();
    setState({ status: "loading", message: "Envoi en cours…" });
    const email = new FormData(event.currentTarget).get("email");
    try {
      const data = await requestCoreJson("/api/id/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      setState({ status: "success", message: data.message });
    } catch (error) {
      setState({ status: "error", message: error.result?.error || "Impossible d’envoyer le lien pour le moment. Réessayez." });
    }
  }
  return <form className="identity-form" onSubmit={submit} aria-busy={state.status === "loading"}>
    <div className="identity-field"><label htmlFor="reset-email">Adresse email</label><input id="reset-email" name="email" type="email" autoComplete="email" required /></div>
    <button className="button button-primary" disabled={state.status === "loading"}>{state.status === "loading" ? "Envoi…" : "Envoyer le lien"}</button>
    <p className={`identity-feedback ${state.status}`} role="status">{state.message}</p>
    <Link href="/connexion">Retour à la connexion</Link>
  </form>;
}

export function NewPasswordForm() {
  const [state, setState] = useState({ status: "idle", message: "" });
  const [mismatch, setMismatch] = useState(false);
  async function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") || "");
    if (password !== form.get("confirm")) { setMismatch(true); return setState({ status: "error", message: "Les mots de passe ne correspondent pas." }); }
    setMismatch(false);
    const hash = new URLSearchParams(location.hash.slice(1));
    setState({ status: "loading", message: "Modification en cours…" });
    try {
      await requestCoreJson("/api/id/update-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accessToken: hash.get("access_token"), password }) });
      setState({ status: "success", message: "Mot de passe modifié. Vous pouvez vous connecter." });
    } catch (error) {
      setState({ status: "error", message: error.result?.error || "Impossible de modifier le mot de passe pour le moment. Réessayez." });
    }
  }
  return <form className="identity-form" onSubmit={submit} aria-busy={state.status === "loading"}>
    <PasswordField label="Nouveau mot de passe" name="password" minLength={8} autoComplete="new-password" required />
    <PasswordField label="Confirmer le mot de passe" name="confirm" minLength={8} autoComplete="new-password" required error={mismatch ? "Les mots de passe ne correspondent pas." : ""} />
    <button className="button button-primary" disabled={state.status === "loading"}>{state.status === "loading" ? "Modification…" : "Modifier le mot de passe"}</button>
    <p className={`identity-feedback ${state.status}`} role="status">{state.message}</p>
    <Link href="/connexion">Connexion</Link>
  </form>;
}
