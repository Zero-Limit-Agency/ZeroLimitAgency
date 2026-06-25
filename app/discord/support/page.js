import Link from "next/link";
import { DISCORD_BOT_CONFIG } from "@/lib/discord-bot-config";

export const metadata = {
  title: "Support du bot Discord | Zero Limit Agency",
  description: "Contacts officiels pour le support du bot Discord Zero Limit Agency.",
  alternates: { canonical: "https://zerolimit.agency/discord/support" }
};

export default function DiscordSupportPage() {
  return (
    <main className="legal-page-shell">
      <section className="section legal-page-section">
        <div className="container legal-page-stack">
          <div className="legal-page-header">
            <p className="eyebrow">Bot Discord</p>
            <h1>Support du bot Discord Zero Limit Agency</h1>
            <p className="legal-page-lead">Utilisez ces contacts pour une question, un dysfonctionnement, une demande de retrait ou une demande liée aux données personnelles.</p>
          </div>
          <article className="legal-page-card">
            <h2>Demandes acceptées</h2>
            <ul><li>erreur ou dysfonctionnement ;</li><li>question sur une commande ;</li><li>signalement de sécurité ;</li><li>demande relative aux données ;</li><li>demande de retrait du bot ;</li><li>problème d’installation.</li></ul>
          </article>
          <article className="legal-page-card">
            <h2>Contacts officiels</h2>
            <p>Support général : <a href={`mailto:${DISCORD_BOT_CONFIG.supportEmail}`}>{DISCORD_BOT_CONFIG.supportEmail}</a>.</p>
            <p>Données personnelles : <a href={`mailto:${DISCORD_BOT_CONFIG.privacyEmail}`}>{DISCORD_BOT_CONFIG.privacyEmail}</a>.</p>
          </article>
          <div className="legal-page-actions"><Link className="button button-secondary" href="/discord">Retour à la page Discord</Link></div>
        </div>
      </section>
    </main>
  );
}
