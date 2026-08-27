import { Badge, Button } from "@/components/marketing/ui";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { PublicFooter, PublicNavbar } from "@/components/marketing/public-chrome";
import "@/components/marketing/marketing.css";

export const metadata = {
  title: "Page introuvable | Zero Limit Agency",
  robots: { index: false, follow: false }
};

export default function NotFound() {
  return (
    <MarketingShell className="status-page"><a className="zl-skip" href="#main">Aller au contenu</a><PublicNavbar /><main className="error-page-shell" id="main">
      <section className="error-page-card" aria-labelledby="error-page-title">
        <Badge>404</Badge>
        <h1 id="error-page-title">Cette page n’existe pas.</h1>
        <p>
          Le lien demandé n&apos;existe pas ou n&apos;est plus disponible. Retournez sur le site Zero Limit Agency pour
          continuer votre navigation.
        </p>
        <div className="zl-actions"><Button href="/">Retour à l’accueil</Button><Button variant="secondary" href="/#contact">Nous contacter</Button></div>
      </section>
    </main><PublicFooter /></MarketingShell>
  );
}
