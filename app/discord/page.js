import Link from "next/link";
import { EditorialGrid, EditorialHero, GlassFeatureCard, LargeCTASection, ProductInterfaceMock, SplitSection } from "@/components/design-system/editorial-compositions";
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
    <main className="discord-page-shell discord-page-editorial">
      <EditorialHero
        eyebrow="Application Discord officielle"
        title={DISCORD_BOT_CONFIG.name}
        description={DISCORD_BOT_CONFIG.description}
        primaryAction={inviteUrl ? { href: inviteUrl, label: "Inviter le bot" } : null}
        secondaryAction={{ href: "/discord/support", label: "Contact et support" }}
        meta={["Templates", "Permissions", "Communautés"]}
        visual={(
          <ProductInterfaceMock title="Discord Builder" steps={["Intentions", "Structure", "Validation admin"]}>
            <span>Serveur Discord orchestré</span>
          </ProductInterfaceMock>
        )}
      />

      <SplitSection
        eyebrow="Présentation"
        title="Un assistant de structure, pas un remplacement de l'administrateur."
        description="La page reprend le rythme éditorial de /learn-youtube : une idée forte, un visuel produit, puis des blocs utiles et lisibles."
      >
        <EditorialGrid>
          {features.slice(0, 3).map((feature) => (
            <GlassFeatureCard eyebrow="Fonction" title={feature} key={feature} />
          ))}
        </EditorialGrid>
      </SplitSection>

      <section className="section discord-content-section">
        <div className="container discord-content-grid discord-content-grid-editorial">
          <article className="discord-card discord-card-wide">
            <h2>Fonctionnement</h2>
            <ol className="discord-step-list">
              {steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </article>

          <article className="discord-card">
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

          <article className="discord-card">
            <h2>Capacités complémentaires</h2>
            <ul className="discord-check-list">
              {features.slice(3).map((feature) => <li key={feature}>{feature}</li>)}
            </ul>
          </article>
        </div>
      </section>

      <LargeCTASection
        eyebrow="Liens officiels"
        title="Un bot utile doit rester transparent, documenté et contrôlable."
        description="Retrouvez les conditions, la confidentialité, le support et le site Zero Limit principal."
        primaryAction={{ href: "/discord/terms", label: "Conditions" }}
        secondaryAction={{ href: "/discord/privacy", label: "Confidentialité" }}
      />

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
