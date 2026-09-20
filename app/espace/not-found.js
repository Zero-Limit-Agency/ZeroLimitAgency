import Link from "next/link";

export default function SpaceNotFound() {
  return <main className="identity-shell"><section className="identity-card"><p className="eyebrow">Zero Limit</p><h1>Espace indisponible</h1><p>Cet espace n’est pas disponible ou ne fait plus partie de vos accès.</p><Link className="button" href="/espace">Retour aux espaces</Link></section></main>;
}
