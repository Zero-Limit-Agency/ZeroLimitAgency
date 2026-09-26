export function IdentityShell({ title, subtitle, children }) {
  return <main className="identity-shell">
    <div className="identity-ambient" aria-hidden="true" />
    <section className="identity-card" aria-labelledby="identity-title">
      <a className="identity-brand" href="/" aria-label="Zero Limit Agency — accueil">ZERO LIMIT <span>AGENCY</span></a>
      <p className="eyebrow">Zero Limit ID</p>
      <h1 id="identity-title">{title}</h1>
      <p className="identity-subtitle">{subtitle}</p>
      {children}
      <p className="identity-security-note"><span aria-hidden="true">◆</span> Connexion sécurisée à votre univers Zero Limit.</p>
    </section>
  </main>;
}
