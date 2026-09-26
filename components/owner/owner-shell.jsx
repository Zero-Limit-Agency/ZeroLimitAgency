import Link from "next/link";
const COPY = {
  fr: { console: "Console OWNER", back: "Retour aux espaces", security: "Sécurité", active: "Session OWNER vérifiée", modules: "Modules", foundation: "Socle actif", coming: "Identité, espaces, facturation, audit et support arriveront par phases." },
  en: { console: "OWNER Console", back: "Back to spaces", security: "Security", active: "Verified OWNER session", modules: "Modules", foundation: "Foundation active", coming: "Identity, workspaces, billing, audit and support will arrive in phases." }
};
export function OwnerShell({ owner, environment, children }) { const t = COPY[owner.preferredLocale] || COPY.fr; return <main className="owner-shell">
  <header className="owner-header"><div><p className="eyebrow">Zero Limit · {environment}</p><h1>{t.console}</h1></div><Link className="button" href="/espace">{t.back}</Link></header>
  <section className="owner-identity" aria-label={t.security}><div><small>{t.security}</small><strong>{t.active}</strong></div><div><small>Zero Limit ID</small><strong>{owner.displayName} · @{owner.username}</strong></div><span className="owner-badge">OWNER</span></section>
  {children}<section className="owner-panel"><p className="eyebrow">{t.modules}</p><h2>{t.foundation}</h2><p>{t.coming}</p></section>
</main>; }
