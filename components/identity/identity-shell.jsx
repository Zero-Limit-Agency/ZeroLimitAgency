export function IdentityShell({ title, subtitle, children }) {
  return <main className="identity-shell"><section className="identity-card"><a className="identity-brand" href="/">ZERO LIMIT</a><p className="eyebrow">Zero Limit ID</p><h1>{title}</h1><p>{subtitle}</p>{children}</section></main>;
}
