import Link from "next/link";
import { LegalPageTemplate } from "@/components/legal/legal-page-template";
import { DISCORD_BOT_CONFIG } from "@/lib/discord-bot-config";

export const metadata = {
  title: "Politique de confidentialité du bot Discord | Zero Limit Agency",
  alternates: { canonical: "https://zerolimit.agency/discord/privacy" }
};

export default function DiscordPrivacyPage() {
  return (
    <LegalPageTemplate
      eyebrow="Bot Discord"
      title="Politique de confidentialité du bot Discord Zero Limit Agency"
      lead="Cette politique décrit les données susceptibles d’être traitées par l’application Discord de Zero Limit Agency. Le dépôt technique du bot n’est pas présent dans ce repository site : les éléments opérationnels doivent être confirmés avant validation juridique finale."
      lastUpdated={DISCORD_BOT_CONFIG.legalLastUpdated}
    >
      <article className="legal-page-card legal-page-note">
        <h2>Point d’audit à confirmer</h2>
        <p>Le dépôt du bot Discord n’est pas disponible dans cette session. Le texte ci-dessous est rédigé prudemment à partir des fonctionnalités publiques demandées et doit être relu avec le code du bot pour confirmer les données reçues, logs, bases de données, services d’IA, services externes et règles de conservation effectives.</p>
      </article>
      <article className="legal-page-card">
        <h2>1. Données susceptibles d’être traitées</h2>
        <p>Selon les commandes utilisées et les permissions accordées, le bot peut recevoir ou traiter les données strictement nécessaires à son fonctionnement : identifiant du serveur Discord, identifiant de l’utilisateur lançant une commande, identifiants de catégories, salons ou rôles concernés, contenu de la commande ou description transmise, paramètres d’exécution, templates ou résultats générés, date et heure d’action, état d’opération, erreurs et journaux techniques.</p>
        <p>Le bot ne doit pas collecter volontairement plus de données que nécessaire. Cette politique n’annonce pas d’accès aux messages privés ni à l’ensemble des messages d’un serveur lorsque cela n’est pas requis par les commandes.</p>
      </article>
      <article className="legal-page-card">
        <h2>2. Finalités</h2>
        <ul><li>répondre aux commandes Discord ;</li><li>générer ou préparer des templates ;</li><li>configurer des éléments de serveur lorsque l’administrateur l’autorise ;</li><li>prévenir les abus et sécuriser le service ;</li><li>diagnostiquer les erreurs et améliorer la stabilité ;</li><li>fournir une assistance aux administrateurs concernés.</li></ul>
      </article>
      <article className="legal-page-card">
        <h2>3. Intelligence artificielle</h2>
        <p>Le bot peut utiliser ou prévoir d’utiliser un système d’intelligence artificielle pour générer certaines structures ou suggestions. Le pipeline exact, le fournisseur éventuel, le mode de conservation des descriptions et l’utilisation éventuelle pour l’entraînement d’un modèle doivent être confirmés dans le dépôt du bot avant publication définitive. Aucun fournisseur externe n’est nommé ici faute d’audit technique disponible.</p>
      </article>
      <article className="legal-page-card">
        <h2>4. Conservation</h2>
        <p>Les règles précises de conservation des logs techniques, prompts, templates, rapports d’erreur, données de configuration et demandes de support doivent être confirmées avec le dépôt du bot et l’infrastructure réellement utilisée. En l’absence de politique de suppression documentée, ce point doit être corrigé techniquement avant validation juridique finale.</p>
      </article>
      <article className="legal-page-card">
        <h2>5. Partage et sous-traitants</h2>
        <p>Les données nécessaires transitent par Discord. L’hébergement du site est prévu pour le domaine officiel Zero Limit Agency. Les autres prestataires éventuels du bot, comme hébergeur, base de données, service d’intelligence artificielle ou monitoring, doivent être listés uniquement après audit de l’infrastructure réelle. Les données du bot ne sont pas vendues à des annonceurs.</p>
      </article>
      <article className="legal-page-card">
        <h2>6. Sécurité</h2>
        <p>Zero Limit Agency applique des mesures générales de sécurité : limitation des accès, usage de variables d’environnement pour les secrets, contrôle des permissions Discord, journaux techniques, mises à jour et prévention des abus. Aucun token Discord, clé API, secret ou identifiant sensible interne ne doit être publié.</p>
      </article>
      <article className="legal-page-card">
        <h2>7. Droits et demandes</h2>
        <p>Pour demander l’accès, la correction ou la suppression de données lorsque cela est applicable, contactez <a href={`mailto:${DISCORD_BOT_CONFIG.privacyEmail}`}>{DISCORD_BOT_CONFIG.privacyEmail}</a>. La demande peut devoir contenir l’identifiant Discord de l’utilisateur, l’identifiant du serveur concerné et les éléments permettant de retrouver les données. Ne transmettez jamais votre mot de passe ou token Discord.</p>
      </article>
      <article className="legal-page-card">
        <h2>8. Mineurs</h2>
        <p>L’utilisation du bot s’effectue dans l’environnement Discord et doit respecter les règles de Discord ainsi que le droit applicable. Les administrateurs doivent être attentifs à la présence de mineurs dans leurs communautés et éviter de transmettre des données inutiles au bot.</p>
      </article>
      <article className="legal-page-card">
        <h2>9. Modifications</h2>
        <p>Date d’entrée en vigueur : {DISCORD_BOT_CONFIG.legalEffectiveDate}. Dernière mise à jour : {DISCORD_BOT_CONFIG.legalLastUpdated}. Toute modification sera publiée sur cette page.</p>
        <p><Link href="/discord/terms">Consulter les conditions d’utilisation du bot</Link>.</p>
      </article>
    </LegalPageTemplate>
  );
}
