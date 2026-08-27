"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function IdentityAuthForm({ mode }) {
  const router = useRouter();
  const [state, setState] = useState({ status: "idle", message: "" });
  async function submit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password") || "");
    if (mode === "signup" && password !== data.get("confirmPassword")) return setState({ status: "error", message: "Les mots de passe ne correspondent pas." });
    setState({ status: "loading", message: "Traitement en cours…" });
    const response = await fetch(`/api/id/${mode === "signup" ? "signup" : "login"}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: data.get("email"), password, acceptedTerms: data.get("terms") === "on" }) });
    const result = await response.json().catch(() => null);
    if (!response.ok) return setState({ status: "error", message: result?.error || "Une erreur est survenue." });
    setState({ status: "success", message: result.message || "Connexion réussie." });
    if (mode === "login" || result.hasSession) { router.replace("/identite"); router.refresh(); }
  }
  const signup = mode === "signup";
  return <form className="identity-form" onSubmit={submit} aria-busy={state.status === "loading"}>
    <label>Email<input name="email" type="email" autoComplete="email" required /></label>
    <label>Mot de passe<input name="password" type="password" minLength={8} autoComplete={signup ? "new-password" : "current-password"} required /></label>
    {signup && <><label>Confirmer le mot de passe<input name="confirmPassword" type="password" minLength={8} autoComplete="new-password" required /></label><label className="identity-check"><input name="terms" type="checkbox" required /><span>J’accepte les <Link href="/conditions-generales-d-utilisation">conditions d’utilisation</Link> et la <Link href="/politique-de-confidentialite">politique de confidentialité</Link>.</span></label></>}
    <button className="button button-primary" disabled={state.status === "loading"}>{state.status === "loading" ? "Patientez…" : signup ? "Créer mon Zero Limit ID" : "Se connecter"}</button>
    <p className={`identity-feedback ${state.status}`} role="status">{state.message}</p>
    {!signup && <Link className="auth-inline-link" href="/identite/mot-de-passe-oublie">Mot de passe oublié ?</Link>}
    <Link className="auth-inline-link" href={signup ? "/identite/connexion" : "/identite/inscription"}>{signup ? "Déjà inscrit ? Se connecter" : "Créer un Zero Limit ID"}</Link>
  </form>;
}
