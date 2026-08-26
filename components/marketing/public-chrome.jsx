import Link from "next/link";

import { Container } from "@/components/shared/container";
import { Button } from "./ui";

export function PublicNavbar() {
  return (
    <header className="zl-header zl-header--public">
      <Container>
        <nav className="zl-navbar zl-navbar--public" aria-label="Navigation principale">
          <Link className="zl-brand" href="/" aria-label="Zero Limit Agency — accueil">
            <img src="/assets/zero-limit-logo.png" alt="" />
            <span>ZERO LIMIT<small>AGENCY</small></span>
          </Link>
          <div className="zl-public-nav-actions">
            <Link href="/#ecosystem">Écosystème</Link>
            <Link href="/#contact">Contact</Link>
            <Button href="/connexion" variant="secondary" size="sm">Se connecter</Button>
          </div>
        </nav>
      </Container>
    </header>
  );
}

export function PublicFooter({ minimal = false }) {
  return (
    <footer className={`zl-footer ${minimal ? "zl-footer--minimal" : ""}`}>
      <Container>
        <div className="zl-footer-grid zl-footer-grid--public">
          <div>
            <Link className="zl-brand" href="/" aria-label="Zero Limit Agency — accueil">
              <img src="/assets/zero-limit-logo.png" alt="" />
              <span>ZERO LIMIT<small>AGENCY</small></span>
            </Link>
            <p>Un écosystème pour structurer, progresser et créer sans limite.</p>
          </div>
          <div><strong>Produits</strong><Link href="/#spaces">Espaces</Link><Link href="/#tools">Outils</Link><Link href="/#pricing">Tarifs</Link></div>
          <div><strong>Ressources</strong><Link href="/#faq">Questions fréquentes</Link></div>
          <div><strong>Agence</strong><Link href="/#ecosystem">Écosystème</Link><Link href="/#contact">Contact</Link></div>
          <div><strong>Informations</strong><Link href="/mentions-legales">Mentions légales</Link><Link href="/politique-de-confidentialite">Confidentialité</Link><Link href="/conditions-generales-de-vente">CGV</Link><Link href="/conditions-generales-d-utilisation">CGU</Link><Link href="/politique-de-remboursement">Remboursements</Link></div>
        </div>
        <div className="zl-footer-bottom"><span>© {new Date().getFullYear()} Zero Limit Agency. Tous droits réservés.</span><span>FR · Paris, France</span></div>
      </Container>
    </footer>
  );
}
