"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function OnboardingForm({ profile, next }) {
  const router = useRouter(); const [step, setStep] = useState(1); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(event) { event.preventDefault(); setLoading(true); setError(""); const data = new FormData(event.currentTarget); const response = await fetch("/api/id/onboarding", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(data)) }); const result = await response.json().catch(() => null); setLoading(false); if (!response.ok) return setError(result?.error || "Enregistrement impossible."); router.replace(result.redirectTo); router.refresh(); }
  return <form className="identity-form" onSubmit={submit}>
    <input type="hidden" name="next" value={next || ""} />
    <p className="identity-progress">Étape {step} sur 3</p>
    <fieldset hidden={step !== 1}><legend>Votre identité</legend><label>Nom d’utilisateur<input name="username" defaultValue={profile.username.startsWith("zlid_") ? "" : profile.username} minLength={3} maxLength={32} pattern={"[a-z0-9][a-z0-9_.\\-]{2,31}"} autoComplete="username" required /></label><p className="identity-hint">3–32 caractères minuscules, chiffres, point, tiret ou underscore.</p><label>Nom affiché<input name="displayName" defaultValue={profile.display_name === "Membre Zero Limit" ? "" : profile.display_name} maxLength={80} autoComplete="name" required /></label></fieldset>
    <fieldset hidden={step !== 2}><legend>Votre préférence</legend><label>Langue<select name="locale" defaultValue={profile.preferred_locale}><option value="fr">Français</option><option value="en">English</option></select></label></fieldset>
    <fieldset hidden={step !== 3}><legend>Comment souhaitez-vous utiliser Zero Limit ?</legend><div className="identity-choices">{[["personal","Personal"],["creator","Creator"],["team","Team"]].map(([value,label]) => <label key={value}><input type="radio" name="intent" value={value} required /><span><strong>{label}</strong><small>Orientation uniquement — aucun abonnement ni espace créé.</small></span></label>)}</div></fieldset>
    {error && <p className="identity-feedback error" role="alert">{error}</p>}
    <div className="identity-buttons">{step > 1 && <button type="button" className="button button-dark" onClick={() => setStep(step - 1)}>Retour</button>}{step < 3 ? <button type="button" className="button button-primary" onClick={() => setStep(step + 1)}>Continuer</button> : <button className="button button-primary" disabled={loading}>{loading ? "Enregistrement…" : "Terminer"}</button>}</div>
  </form>;
}
