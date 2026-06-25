import Link from "next/link";
import { LegalPageTemplate } from "@/components/legal/legal-page-template";
import { DISCORD_BOT_CONFIG } from "@/lib/discord-bot-config";

export const metadata = {
  title: "Conditions d’utilisation du bot Discord | Zero Limit Agency",
  alternates: { canonical: "https://zerolimit.agency/discord/terms" }
};

export default function DiscordTermsPage() {
  return (
    <LegalPageTemplate
      eyebrow="Bot Discord"
      title="Conditions d’utilisation du bot Discord Zero Limit Agency"
      lead="Ces conditions encadrent l’installation et l’utilisation de l’application Discord développée par Zero Limit Agency. Elles sont distinctes des CGU générales du site."
      lastUpdated={DISCORD_BOT_CONFIG.legalLastUpdated}
    >
      <article className="legal-page-card">
        <h2>1. Présentation du service</h2>
        <p><strong>Zero Limit Agency</strong> opère {DISCORD_BOT_CONFIG.name}, une application Discord destinée à assister les administrateurs de serveurs dans la préparation de structures, rôles, salons, permissions, templates, messages et embeds.</p>
        <p>Le service s’adresse aux personnes disposant des autorisations nécessaires sur le serveur Discord concerné. L’installation ou l’utilisation du bot implique l’acceptation des présentes conditions applicables au bot.</p>
      </article>
      <article className="legal-page-card">
        <h2>2. Conditions d’accès</h2>
        <ul><li>disposer d’un compte Discord valide ;</li><li>respecter les règles, conditions et politiques de Discord ;</li><li>disposer des autorisations nécessaires sur le serveur ;</li><li>ne pas utiliser le bot sans autorisation du propriétaire ou des administrateurs concernés.</li></ul>
      </article>
      <article className="legal-page-card">
        <h2>3. Responsabilité de l’administrateur</h2>
        <p>L’administrateur du serveur reste responsable des commandes envoyées, permissions accordées, templates exécutés, rôles, salons et permissions créés, de la vérification du résultat avant ou après exécution, ainsi que du contenu transmis au bot.</p>
      </article>
      <article className="legal-page-card">
        <h2>4. Utilisations interdites</h2>
        <p>Il est interdit d’utiliser le bot pour des activités illégales, du harcèlement, du spam, des raids, de la fraude, le contournement de permissions, la diffusion de logiciels malveillants, l’exploitation de failles, des contenus interdits par Discord ou toute action visant à endommager un serveur ou ses membres.</p>
      </article>
      <article className="legal-page-card">
        <h2>5. Disponibilité et évolution</h2>
        <p>Le service peut évoluer, être corrigé, suspendu partiellement ou interrompu pour maintenance. Aucune disponibilité permanente n’est garantie.</p>
      </article>
      <article className="legal-page-card">
        <h2>6. Génération automatisée</h2>
        <p>Certaines structures ou suggestions peuvent être produites automatiquement. Les utilisateurs doivent vérifier les résultats avant toute utilisation importante. Zero Limit Agency ne garantit pas que les générations soient toujours exactes, complètes ou exemptes d’erreur.</p>
      </article>
      <article className="legal-page-card">
        <h2>7. Suspension et retrait d’accès</h2>
        <p>Zero Limit Agency peut limiter l’accès, suspendre l’utilisation, bloquer un serveur ou retirer le bot en cas d’abus, de risque de sécurité, de violation des présentes conditions ou de comportement incompatible avec les règles de Discord.</p>
      </article>
      <article className="legal-page-card">
        <h2>8. Propriété intellectuelle</h2>
        <p>Le code, l’identité visuelle, les interfaces et éléments propres au bot appartiennent à Zero Limit Agency ou à leurs titulaires respectifs. Les contenus transmis par les utilisateurs restent sous leur responsabilité. Discord conserve ses droits sur ses marques, services et interfaces. Les templates ou résultats générés doivent être vérifiés avant réutilisation.</p>
      </article>
      <article className="legal-page-card">
        <h2>9. Limitation de responsabilité</h2>
        <p>Zero Limit Agency ne peut être tenue responsable des erreurs de configuration, pertes ou dommages résultant d’une mauvaise utilisation, d’un changement demandé par un administrateur, d’une interruption du service ou du fonctionnement de services tiers, dans les limites prévues par le droit applicable.</p>
      </article>
      <article className="legal-page-card">
        <h2>10. Modification des conditions</h2>
        <p>Date d’entrée en vigueur : {DISCORD_BOT_CONFIG.legalEffectiveDate}. Les présentes conditions peuvent évoluer. La version applicable sera publiée sur cette page avec sa date de mise à jour.</p>
      </article>
      <article className="legal-page-card">
        <h2>11. Contact</h2>
        <p>Questions générales : <a href={`mailto:${DISCORD_BOT_CONFIG.supportEmail}`}>{DISCORD_BOT_CONFIG.supportEmail}</a>.</p>
        <p>Données personnelles : <a href={`mailto:${DISCORD_BOT_CONFIG.privacyEmail}`}>{DISCORD_BOT_CONFIG.privacyEmail}</a>.</p>
        <p><Link href="/discord/privacy">Consulter la politique de confidentialité du bot</Link>.</p>
      </article>
    </LegalPageTemplate>
  );
}
