export function IdentityShell({ title, subtitle, children }) {
  return <main className="identity-shell">
    <div className="identity-ambient" aria-hidden="true" />
    <section className="identity-card" aria-labelledby="identity-title">
      <header className="identity-header">
        <a className="identity-brand" href="/" aria-label="Zero Limit Agency — accueil">ZERO LIMIT</a>
        <p className="eyebrow">Zero Limit ID</p>
      </header>
      <h1 id="identity-title">{title}</h1>
      <p className="identity-subtitle">{subtitle}</p>
      {children}
    </section>
  </main>;
}
