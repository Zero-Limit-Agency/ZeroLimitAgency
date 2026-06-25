import Link from "next/link";
import { DISCORD_BOT_CONFIG } from "@/lib/discord-bot-config";

export const metadata = {
  title: "Bot Discord | Zero Limit Agency",
  description:
    "Découvrez le bot Discord développé par Zero Limit Agency pour concevoir et organiser des serveurs Discord.",
  alternates: { canonical: "https://zerolimit.agency/discord" }
};

const features = [
  "Génération de catégories et salons",
  "Création et organisation de rôles",
  "Configuration de permissions selon les droits accordés",
  "Templates de serveurs et messages ou embeds",
  "Assistance à la création de communautés"
];

const steps = [
  "Le bot est ajouté à un serveur autorisé.",
  "Un administrateur utilise une commande slash, comme /build ou /template-create lorsque la commande est disponible.",
  "Le bot prépare ou génère une structure adaptée à la demande.",
  "L’administrateur examine le résultat proposé ou généré.",
  "Les actions sont exécutées selon les autorisations accordées au bot et au serveur."
];

export default function DiscordBotPage() {
  const inviteUrl = DISCORD_BOT_CONFIG.inviteUrl;

  return (
    <main className="discord-page-shell">
      <section className="section discord-hero-section">
        <div className="container discord-hero-grid">
          <div className="discord-hero-copy">
            <p className="eyebrow">Application Discord officielle</p>
            <h1>{DISCORD_BOT_CONFIG.name}</h1>
            <p className="discord-hero-kicker">Un bot développé par Zero Limit Agency</p>
            <p className="discord-hero-lead">{DISCORD_BOT_CONFIG.description}</p>
            <div className="discord-actions" aria-label="Actions principales du bot Discord">
              {inviteUrl ? (
                <a className="button button-primary" href={inviteUrl} target="_blank" rel="noopener noreferrer">
                  Inviter le bot
                </a>
              ) : null}
              <Link className="button button-secondary" href="/discord/support">
                Contact et support
              </Link>
            </div>
          </div>
          <aside className="discord-hero-panel" aria-label="Informations clés">
            <span className="discord-orb" aria-hidden="true" />
            <h2>Concevoir un serveur plus vite, sans retirer le contrôle aux administrateurs.</h2>
            <p>
              Le bot accompagne la préparation de structures Discord : catégories, salons, rôles,
              permissions, templates, messages et embeds utiles à une communauté.
            </p>
          </aside>
        </div>
      </section>

      <section className="section discord-content-section">
        <div className="container discord-content-grid">
          <article className="discord-card">
            <h2>Présentation</h2>
            <p>
              {DISCORD_BOT_CONFIG.name} aide les administrateurs à concevoir et administrer des
              structures de serveurs Discord. Il sert d’assistant pour transformer une intention de
              communauté en organisation plus claire, avec des éléments vérifiables par l’équipe du serveur.
            </p>
            <ul className="discord-check-list">
              {features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </article>

          <article className="discord-card">
            <h2>Fonctionnement</h2>
            <ol className="discord-step-list">
              {steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </article>

          <article className="discord-card discord-card-wide">
            <h2>Sécurité et contrôle</h2>
            <p>
              Seules les permissions nécessaires doivent être accordées. Certaines actions peuvent
              nécessiter des droits administratifs Discord, et les administrateurs du serveur restent
              responsables des commandes, des permissions et des changements demandés.
            </p>
            <p>
              Cette application est développée par Zero Limit Agency. Elle n’est pas présentée comme
              affiliée, sponsorisée ou approuvée officiellement par Discord.
            </p>
          </article>
        </div>
      </section>

      <section className="section discord-links-section">
        <div className="container discord-links-card">
          <h2>Liens importants</h2>
          <nav aria-label="Liens officiels du bot Discord" className="discord-important-links">
            <Link href="/discord/terms">Conditions d’utilisation</Link>
            <Link href="/discord/privacy">Politique de confidentialité</Link>
            <Link href="/discord/support">Contact</Link>
            <Link href="/">Site principal Zero Limit Agency</Link>
          </nav>
        </div>
      </section>
    </main>
  );
}
