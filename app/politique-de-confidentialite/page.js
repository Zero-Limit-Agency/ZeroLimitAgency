import { LegalPageTemplate } from "@/components/legal/legal-page-template";

export const metadata = {
  title: "Politique de confidentialité | Zero Limit Agency"
};

const LAST_UPDATED = "8 mai 2026 à 19:22";

export default function PolitiqueConfidentialitePage() {
  return (
    <LegalPageTemplate
      eyebrow="Site"
      title="Politique de confidentialité"
      lead="Cette page explique comment Zero Limit Agency collecte, utilise, conserve et protège les données personnelles des utilisateurs du site."
      lastUpdated={LAST_UPDATED}
    >
      <article className="legal-page-card">
        <h2>1. Données personnelles collectées</h2>
        <p>
          Dans le cadre de l’utilisation du site, de la création d’un profil client, de l’inscription
          à la newsletter ou de l’envoi d’une demande particulière, nous pouvons collecter les données
          suivantes :
        </p>
        <ul>
          <li>nom ;</li>
          <li>prénom ;</li>
          <li>pseudo ;</li>
          <li>adresse email ;</li>
          <li>mot de passe ;</li>
          <li>date de naissance ;</li>
          <li>société ;</li>
          <li>langue ;</li>
          <li>demande particulière ;</li>
          <li>préférences de communication ;</li>
          <li>inscription ou non à la newsletter ;</li>
          <li>données techniques liées à l’utilisation du site ;</li>
          <li>échanges ou informations transmises volontairement par l’utilisateur.</li>
        </ul>
        <p>
          Le mot de passe n’a pas vocation à être conservé en clair. Il doit être protégé par des
          moyens techniques adaptés, notamment par un système de hachage sécurisé.
        </p>
      </article>

      <article className="legal-page-card">
        <h2>2. Finalités du traitement</h2>
        <p>Les données personnelles collectées peuvent être utilisées pour les finalités suivantes :</p>
        <ul>
          <li>permettre la création et la gestion d’un profil client ;</li>
          <li>permettre l’accès à un espace client ;</li>
          <li>identifier l’utilisateur et sécuriser son compte ;</li>
          <li>répondre aux demandes envoyées via le site ;</li>
          <li>comprendre les besoins de l’utilisateur ;</li>
          <li>adapter les échanges, recommandations ou contenus proposés ;</li>
          <li>
            vérifier l’âge de l’utilisateur lorsque cela est nécessaire, notamment pour adapter les
            conseils liés à des démarches administratives, entrepreneuriales ou contractuelles ;
          </li>
          <li>gérer l’inscription à la newsletter ;</li>
          <li>
            envoyer des communications liées au projet, aux contenus, aux services ou aux actualités
            de Zero Limit Agency ;
          </li>
          <li>améliorer le fonctionnement, la sécurité et l’expérience utilisateur du site ;</li>
          <li>
            prévenir les abus, fraudes, usages illicites ou tentatives d’accès non autorisées ;
          </li>
          <li>respecter d’éventuelles obligations légales ou réglementaires.</li>
        </ul>
      </article>

      <article className="legal-page-card">
        <h2>3. Date de naissance</h2>
        <p>
          La date de naissance est collectée afin d’estimer l’âge de l’utilisateur et d’adapter les
          informations ou recommandations fournies, notamment lorsque celles-ci concernent des
          démarches administratives, entrepreneuriales, contractuelles ou liées à la capacité
          d’engagement d’un utilisateur.
        </p>
        <p>Cette information n’a pas vocation à être affichée publiquement sur le site.</p>
        <p>
          L’utilisateur est invité à fournir des informations exactes afin de permettre un
          accompagnement adapté.
        </p>
      </article>

      <article className="legal-page-card">
        <h2>4. Création de compte et espace client</h2>
        <p>
          Le site peut permettre à l’utilisateur de créer un profil client ou un espace personnel.
        </p>
        <p>
          L’utilisateur s’engage à fournir des informations exactes, à jour et personnelles. Il est
          responsable de la confidentialité de ses identifiants de connexion et de toute activité
          réalisée depuis son compte.
        </p>
        <p>
          En cas de suspicion d’utilisation frauduleuse, d’accès non autorisé ou de compromission du
          compte, l’utilisateur est invité à contacter rapidement :
        </p>
        <p>
          <strong>clients@zerolimit.agency</strong>
        </p>
        <p>
          L’utilisateur peut demander la suppression de son compte à tout moment en envoyant une
          demande à cette même adresse.
        </p>
      </article>

      <article className="legal-page-card">
        <h2>5. Newsletter</h2>
        <p>L’utilisateur peut choisir de s’inscrire à la newsletter de Zero Limit Agency.</p>
        <p>
          L’inscription à la newsletter repose sur le consentement de l’utilisateur. La case
          d’inscription ne doit pas être pré-cochée.
        </p>
        <p>L’utilisateur peut se désinscrire à tout moment :</p>
        <ul>
          <li>
            en cliquant sur le lien de désinscription présent dans les emails, lorsque celui-ci est
            disponible ;
          </li>
          <li>ou en envoyant une demande à <strong>contact@zerolimit.agency</strong>.</li>
        </ul>
        <p>
          La désinscription à la newsletter n’entraîne pas automatiquement la suppression du compte
          client, sauf demande spécifique de l’utilisateur.
        </p>
      </article>

      <article className="legal-page-card">
        <h2>6. Utilisation d’outils d’intelligence artificielle</h2>
        <p>
          Certaines informations fournies par l’utilisateur peuvent être traitées avec l’aide
          d’outils d’intelligence artificielle, notamment <strong>OpenAI / ChatGPT</strong>, afin de :
        </p>
        <ul>
          <li>résumer des informations ;</li>
          <li>structurer des demandes ;</li>
          <li>analyser un profil client ;</li>
          <li>préparer un échange ou un accompagnement ;</li>
          <li>améliorer la compréhension des besoins exprimés par l’utilisateur.</li>
        </ul>
        <p>
          L’utilisateur est invité à ne pas transmettre de données sensibles ou confidentielles qui ne
          seraient pas nécessaires à sa demande.
        </p>
        <p>
          Les données pouvant être sensibles comprennent notamment les informations relatives à la
          santé, aux opinions politiques, aux convictions religieuses, à l’orientation sexuelle, à la
          situation financière détaillée, aux documents d’identité, aux mots de passe ou à toute
          information strictement privée.
        </p>
        <p>
          Lorsque cela est possible, les informations transmises à des outils d’intelligence
          artificielle sont limitées aux éléments nécessaires au traitement de la demande.
        </p>
      </article>

      <article className="legal-page-card">
        <h2>7. Paiements et Stripe</h2>
        <p>
          À ce jour, le site <strong>zerolimit.agency</strong> ne permet pas de passer commande ni
          d’effectuer un paiement directement en ligne.
        </p>
        <p>
          Des paiements peuvent éventuellement être proposés en dehors du site, après échange direct
          avec l’utilisateur, notamment via un lien de paiement externe tel que <strong>Stripe</strong>.
        </p>
        <p>
          Dans ce cas, les données de paiement sont traitées directement par le prestataire de paiement
          concerné, selon ses propres conditions d’utilisation et sa propre politique de
          confidentialité.
        </p>
        <p>
          Zero Limit Agency ne collecte pas directement les numéros complets de carte bancaire via le
          site.
        </p>
      </article>

      <article className="legal-page-card">
        <h2>8. Destinataires des données</h2>
        <p>
          Les données personnelles collectées sont destinées à l’éditeur du site et, lorsque cela est
          nécessaire, aux prestataires techniques utilisés pour assurer le fonctionnement du site et
          des services associés.
        </p>
        <p>Ces prestataires peuvent notamment inclure :</p>
        <ul>
          <li>l’hébergeur du site, Vercel ;</li>
          <li>les services d’authentification ou de gestion de compte ;</li>
          <li>les services d’envoi d’emails ou de newsletter ;</li>
          <li>les services d’intelligence artificielle, notamment OpenAI / ChatGPT ;</li>
          <li>
            les services de paiement externes, notamment Stripe, lorsque le paiement est réalisé hors
            site ;
          </li>
          <li>les outils techniques nécessaires à la sécurité, à la maintenance ou à l’amélioration du site.</li>
        </ul>
        <p>Les données ne sont pas vendues à des tiers.</p>
      </article>

      <article className="legal-page-card">
        <h2>9. Transferts hors Union européenne</h2>
        <p>
          Certains prestataires techniques utilisés peuvent être situés en dehors de l’Union
          européenne ou traiter des données depuis des pays situés hors de l’Union européenne.
        </p>
        <p>
          Lorsque de tels transferts sont nécessaires, ils doivent être encadrés par des garanties
          appropriées conformément à la réglementation applicable en matière de protection des données
          personnelles.
        </p>
        <p>
          L’utilisateur reconnaît que l’utilisation de services tiers, notamment des services
          d’hébergement, d’intelligence artificielle, d’emailing ou de paiement, peut impliquer des
          traitements techniques réalisés en dehors de l’Union européenne.
        </p>
      </article>

      <article className="legal-page-card">
        <h2>10. Durées de conservation</h2>
        <p>
          Les données personnelles sont conservées uniquement pendant la durée nécessaire aux finalités
          pour lesquelles elles ont été collectées, sauf obligation légale ou demande de suppression
          applicable.
        </p>
        <p>Les durées de conservation prévues sont les suivantes :</p>
        <ul>
          <li>
            données du compte client : conservées tant que le compte existe, puis supprimées après
            demande de suppression ;
          </li>
          <li>
            données liées à une demande ou à un échange : conservées pendant une durée maximale de 3
            ans après le dernier contact ;
          </li>
          <li>données prospects : conservées pendant une durée maximale de 3 ans après le dernier contact ;</li>
          <li>données liées à la newsletter : conservées jusqu’au désabonnement de l’utilisateur ;</li>
          <li>logs techniques et données de sécurité : conservés pendant une durée maximale de 18 mois ;</li>
          <li>
            données de paiement réalisées hors site via Stripe : gérées par Stripe selon ses propres
            règles de conservation.
          </li>
        </ul>
        <p>
          Certaines données peuvent être conservées plus longtemps si cela est nécessaire pour
          respecter une obligation légale, défendre un droit ou répondre à une demande d’une autorité
          compétente.
        </p>
      </article>

      <article className="legal-page-card">
        <h2>11. Sécurité des données</h2>
        <p>
          Zero Limit Agency met en œuvre des mesures raisonnables afin de protéger les données
          personnelles contre l’accès non autorisé, la perte, l’altération, la divulgation ou la
          destruction.
        </p>
        <p>Ces mesures peuvent notamment inclure :</p>
        <ul>
          <li>l’utilisation d’un hébergement sécurisé ;</li>
          <li>la protection des accès administrateurs ;</li>
          <li>la limitation des accès aux données ;</li>
          <li>le hachage des mots de passe ;</li>
          <li>la surveillance des usages abusifs ;</li>
          <li>la mise à jour régulière des outils techniques utilisés.</li>
        </ul>
        <p>
          L’utilisateur reconnaît toutefois qu’aucun système informatique ne peut garantir une
          sécurité absolue.
        </p>
      </article>

      <article className="legal-page-card">
        <h2>12. Droits des utilisateurs</h2>
        <p>
          Conformément à la réglementation applicable en matière de protection des données
          personnelles, l’utilisateur peut demander :
        </p>
        <ul>
          <li>l’accès à ses données personnelles ;</li>
          <li>la rectification de données inexactes ou incomplètes ;</li>
          <li>la suppression de ses données ;</li>
          <li>la limitation du traitement ;</li>
          <li>l’opposition au traitement ;</li>
          <li>le retrait de son consentement, notamment pour la newsletter ;</li>
          <li>la portabilité de ses données, lorsque cela est applicable.</li>
        </ul>
        <p>Pour exercer ces droits, l’utilisateur peut envoyer une demande à :</p>
        <p>
          <strong>clients@zerolimit.agency</strong>
        </p>
        <p>
          Une preuve d’identité pourra être demandée si nécessaire afin d’éviter toute demande
          frauduleuse ou non autorisée.
        </p>
      </article>

      <article className="legal-page-card">
        <h2>13. Suppression du compte</h2>
        <p>
          L’utilisateur peut demander la suppression de son compte client à tout moment en écrivant à :
        </p>
        <p>
          <strong>clients@zerolimit.agency</strong>
        </p>
        <p>
          La suppression du compte entraîne la suppression ou l’anonymisation des données associées,
          sauf lorsque leur conservation est nécessaire pour respecter une obligation légale, régler un
          litige, prévenir une fraude ou défendre un droit.
        </p>
        <p>
          La suppression du compte ne supprime pas automatiquement les données conservées par des
          services tiers, notamment les services de paiement, d’emailing ou d’intelligence
          artificielle, lorsque ces derniers appliquent leurs propres règles de conservation.
        </p>
      </article>

      <article className="legal-page-card">
        <h2>14. Cookies et données techniques</h2>
        <p>
          Le site peut utiliser des cookies ou technologies similaires nécessaires à son bon
          fonctionnement, notamment pour :
        </p>
        <ul>
          <li>maintenir une session utilisateur ;</li>
          <li>sécuriser l’accès à l’espace client ;</li>
          <li>mémoriser certaines préférences ;</li>
          <li>améliorer la navigation ;</li>
          <li>analyser le fonctionnement technique du site.</li>
        </ul>
        <p>
          Si des cookies non essentiels, notamment analytiques, publicitaires ou de mesure d’audience,
          sont utilisés, un bandeau ou système de consentement adapté devra être mis en place.
        </p>
        <p>
          L’utilisateur peut généralement configurer son navigateur afin de refuser ou supprimer
          certains cookies.
        </p>
      </article>

      <article className="legal-page-card">
        <h2>15. Données des mineurs</h2>
        <p>
          Le site peut collecter la date de naissance afin d’adapter certaines informations selon
          l’âge de l’utilisateur.
        </p>
        <p>
          Si un utilisateur mineur utilise le site, il est invité à le faire avec l’accord et
          l’accompagnement de son représentant légal lorsque cela est nécessaire.
        </p>
        <p>
          Zero Limit Agency se réserve la possibilité de limiter certains échanges, recommandations,
          prestations ou accompagnements lorsqu’ils ne sont pas adaptés à l’âge, à la situation ou à
          la capacité juridique de l’utilisateur.
        </p>
      </article>

      <article className="legal-page-card">
        <h2>16. Modification de la politique de confidentialité</h2>
        <p>
          La présente politique de confidentialité peut être modifiée à tout moment afin de tenir
          compte de l’évolution du site, des outils utilisés, des services proposés ou de la
          réglementation applicable.
        </p>
        <p>
          La date de dernière mise à jour indiquée en haut de la page permet à l’utilisateur
          d’identifier la version applicable.
        </p>
      </article>

      <article className="legal-page-card">
        <h2>17. Contact</h2>
        <p>
          Pour toute question relative à cette politique de confidentialité ou au traitement des
          données personnelles, l’utilisateur peut contacter :
        </p>
        <p>
          <strong>Zero Limit Agency</strong>
          <br />
          <strong>Email :</strong> clients@zerolimit.agency
        </p>
      </article>
    </LegalPageTemplate>
  );
}
