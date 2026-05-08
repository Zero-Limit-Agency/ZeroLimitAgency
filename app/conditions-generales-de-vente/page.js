import { LegalPageTemplate } from "@/components/legal/legal-page-template";

export const metadata = {
  title: "Conditions générales de vente | Zero Limit Agency"
};

const LAST_UPDATED = "8 mai 2026 à 19:26";

export default function ConditionsGeneralesVentePage() {
  return (
    <LegalPageTemplate
      eyebrow="Site"
      title="Conditions générales de vente (CGV)"
      lead="Les présentes CGV précisent le cadre applicable aux échanges commerciaux éventuellement initiés à partir du site Zero Limit Agency."
      lastUpdated={LAST_UPDATED}
    >
      <article className="legal-page-card">
        <p>
          Les présentes conditions générales de vente, ci-après les <strong>“CGV”</strong>, ont pour
          objet de préciser le cadre applicable aux échanges commerciaux éventuellement initiés à
          partir du site <strong>Zero Limit Agency</strong>, accessible à l’adresse{" "}
          <strong>https://zerolimit.agency</strong>.
        </p>
        <p>
          À ce jour, <strong>Zero Limit Agency</strong> est un projet indépendant en cours de
          structuration administrative. Le site ne représente pas une société immatriculée et ne
          constitue pas, à ce stade, une entité juridique distincte.
        </p>
        <p>
          Le site ne permet pas de passer commande ni d’effectuer un paiement directement en ligne.
        </p>
        <p>Pour toute question générale, l’utilisateur peut contacter :</p>
        <p>
          <strong>contact@zerolimit.agency</strong>
        </p>
        <p>
          Pour toute demande liée à un compte client, à des données personnelles ou à une demande
          client, l’utilisateur peut contacter :
        </p>
        <p>
          <strong>clients@zerolimit.agency</strong>
        </p>
      </article>

      <article className="legal-page-card">
        <h2>1. Objet des présentes CGV</h2>
        <p>
          Les présentes CGV ont pour objet de préciser que le site{" "}
          <strong>zerolimit.agency</strong> présente des informations, contenus, services, formations
          ou accompagnements potentiels, sans permettre actuellement de conclure une vente ferme
          directement en ligne.
        </p>
        <p>
          Les informations présentes sur le site sont fournies à titre de présentation et ne
          constituent pas automatiquement une offre commerciale ferme, définitive ou engageante.
        </p>
        <p>
          Toute éventuelle collaboration, formation, prestation, accompagnement ou proposition
          commerciale doit faire l’objet d’un échange préalable entre l’utilisateur et l’éditeur du
          site.
        </p>
      </article>

      <article className="legal-page-card">
        <h2>2. Absence de vente directe sur le site</h2>
        <p>Le site <strong>zerolimit.agency</strong> ne permet pas, à ce jour :</p>
        <ul>
          <li>de passer une commande ferme directement en ligne ;</li>
          <li>de payer une prestation directement depuis le site ;</li>
          <li>de souscrire automatiquement à une offre payante ;</li>
          <li>d’acheter un produit ou service via un panier d’achat ;</li>
          <li>d’obtenir automatiquement une confirmation de commande.</li>
        </ul>
        <p>
          Aucun contrat de vente n’est automatiquement conclu par la simple consultation du site, la
          création d’un compte client, l’envoi d’une demande ou l’inscription à la newsletter.
        </p>
      </article>

      <article className="legal-page-card">
        <h2>3. Prix</h2>
        <p>
          Les prix des éventuelles prestations, formations ou accompagnements ne sont pas affichés
          publiquement sur le site.
        </p>
        <p>
          Lorsqu’une proposition est faite à un utilisateur, le prix est communiqué individuellement
          après échange préalable, en fonction de la demande, du contexte, des besoins exprimés et du
          format proposé.
        </p>
        <p>
          Les prix communiqués hors site peuvent varier selon la nature de la demande, le niveau
          d’accompagnement, la durée, les outils nécessaires ou les modalités convenues avec
          l’utilisateur.
        </p>
      </article>

      <article className="legal-page-card">
        <h2>4. Demandes et échanges préalables</h2>
        <p>
          L’utilisateur peut transmettre certaines informations via son profil client, son espace
          personnel ou tout autre moyen de contact disponible.
        </p>
        <p>
          Ces informations peuvent permettre de mieux comprendre sa situation, ses besoins, son âge,
          sa langue, son projet, sa société ou sa demande particulière.
        </p>
        <p>L’envoi d’une demande ne vaut pas commande.</p>
        <p>La création d’un compte client ne vaut pas commande.</p>
        <p>
          Un échange, appel, message ou diagnostic ne vaut pas automatiquement conclusion d’un contrat
          de vente.
        </p>
      </article>

      <article className="legal-page-card">
        <h2>5. Propositions commerciales hors site</h2>
        <p>
          À la suite d’un échange avec l’utilisateur, une proposition commerciale peut éventuellement
          être formulée hors site.
        </p>
        <p>Cette proposition peut préciser notamment :</p>
        <ul>
          <li>la nature de la prestation, formation ou accompagnement proposé ;</li>
          <li>le prix ;</li>
          <li>les modalités de paiement ;</li>
          <li>les conditions d’annulation ;</li>
          <li>les éventuelles conditions de remboursement ;</li>
          <li>les délais ou modalités d’exécution ;</li>
          <li>les obligations de chaque partie.</li>
        </ul>
        <p>
          Aucune proposition commerciale ne doit être considérée comme acceptée tant que l’utilisateur
          n’a pas exprimé clairement son accord et, le cas échéant, effectué le paiement demandé selon
          les modalités communiquées.
        </p>
      </article>

      <article className="legal-page-card">
        <h2>6. Paiements externes</h2>
        <p>Le site <strong>zerolimit.agency</strong> ne collecte pas directement de paiement.</p>
        <p>
          Lorsqu’un paiement est proposé, il peut être réalisé en dehors du site, notamment via un
          lien de paiement externe transmis après échange préalable, par exemple via{" "}
          <strong>Stripe</strong>.
        </p>
        <p>
          Dans ce cas, le paiement est traité par le prestataire de paiement concerné, selon ses
          propres conditions d’utilisation, règles de sécurité et politique de confidentialité.
        </p>
        <p>
          Zero Limit Agency ne collecte pas directement les numéros complets de carte bancaire sur le
          site.
        </p>
      </article>

      <article className="legal-page-card">
        <h2>7. Formation, accompagnement ou prestation hors site</h2>
        <p>
          Les formations, accompagnements ou prestations éventuellement proposés en dehors du site
          peuvent prendre différentes formes, notamment :
        </p>
        <ul>
          <li>échange individuel ;</li>
          <li>appel ;</li>
          <li>accompagnement personnalisé ;</li>
          <li>formation ;</li>
          <li>analyse de profil ou de projet ;</li>
          <li>structuration d’une demande ;</li>
          <li>aide à la compréhension d’outils digitaux ou d’intelligence artificielle ;</li>
          <li>aide à l’organisation d’un projet.</li>
        </ul>
        <p>Les modalités exactes sont précisées au cas par cas avant tout paiement.</p>
      </article>

      <article className="legal-page-card">
        <h2>8. Absence de promesse de résultat</h2>
        <p>
          Sauf accord écrit contraire, les informations, échanges, contenus, formations ou
          accompagnements proposés ne garantissent aucun résultat précis.
        </p>
        <p>Aucun résultat financier, commercial, administratif, juridique, fiscal, entrepreneurial ou personnel n’est garanti.</p>
        <p>L’utilisateur reste seul responsable :</p>
        <ul>
          <li>de ses décisions ;</li>
          <li>de ses démarches ;</li>
          <li>de ses déclarations ;</li>
          <li>de la mise en œuvre des informations reçues ;</li>
          <li>du respect des lois applicables à sa situation ;</li>
          <li>de ses résultats.</li>
        </ul>
        <p>
          Les informations fournies ne constituent pas un conseil juridique, fiscal, comptable,
          financier ou administratif personnalisé.
        </p>
      </article>

      <article className="legal-page-card">
        <h2>9. Utilisateurs mineurs</h2>
        <p>
          Le site peut demander la date de naissance de l’utilisateur afin d’adapter les échanges, les
          recommandations ou les informations transmises.
        </p>
        <p>
          Si l’utilisateur est mineur, certaines démarches, prestations, formations, recommandations
          ou propositions peuvent nécessiter l’accord ou l’intervention d’un représentant légal.
        </p>
        <p>
          L’éditeur se réserve le droit de refuser ou de limiter une proposition, un échange, une
          prestation ou un accompagnement lorsque la situation, l’âge ou la capacité juridique de
          l’utilisateur ne permet pas de poursuivre dans des conditions adaptées.
        </p>
      </article>

      <article className="legal-page-card">
        <h2>10. Annulation et remboursement</h2>
        <p>
          Le site ne permettant pas de passer commande ni de payer directement en ligne, aucune
          politique de remboursement automatique liée à un achat réalisé sur le site ne s’applique.
        </p>
        <p>
          Lorsqu’un paiement est proposé en dehors du site, les conditions d’annulation ou de
          remboursement doivent être précisées avant le paiement ou au moment de la proposition.
        </p>
        <p>
          À défaut de conditions particulières précisées, toute demande d’annulation ou de
          remboursement est étudiée au cas par cas, en tenant compte notamment :
        </p>
        <ul>
          <li>de la nature de la prestation ;</li>
          <li>du moment de la demande ;</li>
          <li>de l’avancement éventuel de l’accompagnement ;</li>
          <li>des contenus déjà transmis ;</li>
          <li>des échanges déjà réalisés ;</li>
          <li>des frais éventuellement engagés.</li>
        </ul>
        <p>Pour toute demande liée à une prestation ou un paiement externe, l’utilisateur peut écrire à :</p>
        <p>
          <strong>clients@zerolimit.agency</strong>
        </p>
      </article>

      <article className="legal-page-card">
        <h2>11. Données personnelles</h2>
        <p>
          Dans le cadre des échanges initiés via le site, certaines données personnelles peuvent être
          collectées et traitées.
        </p>
        <p>
          Ces données sont traitées conformément à la <strong>Politique de confidentialité</strong>{" "}
          disponible sur le site.
        </p>
        <p>Pour toute demande relative aux données personnelles, l’utilisateur peut contacter :</p>
        <p>
          <strong>clients@zerolimit.agency</strong>
        </p>
      </article>

      <article className="legal-page-card">
        <h2>12. Services tiers</h2>
        <p>Les échanges, prestations ou paiements peuvent s’appuyer sur des services tiers, notamment :</p>
        <ul>
          <li>Vercel pour l’hébergement du site ;</li>
          <li>OpenAI / ChatGPT pour certains traitements d’analyse, de résumé ou de structuration ;</li>
          <li>Stripe pour certains paiements réalisés hors site ;</li>
          <li>des outils d’email, de messagerie, de visioconférence ou d’organisation.</li>
        </ul>
        <p>
          Chaque service tiers dispose de ses propres conditions d’utilisation et politiques de
          confidentialité.
        </p>
        <p>
          L’éditeur ne peut garantir le fonctionnement permanent, la disponibilité ou la politique
          interne de ces services tiers.
        </p>
      </article>

      <article className="legal-page-card">
        <h2>13. Modification des présentes CGV</h2>
        <p>
          Les présentes CGV peuvent être modifiées à tout moment afin de tenir compte de l’évolution
          du site, du projet, des services présentés, des outils utilisés ou de la réglementation
          applicable.
        </p>
        <p>
          La date de dernière mise à jour indiquée en haut de la page permet d’identifier la version
          applicable.
        </p>
      </article>

      <article className="legal-page-card">
        <h2>14. Droit applicable</h2>
        <p>
          Les présentes CGV sont régies par le droit français, sous réserve des règles impératives
          applicables selon la situation de l’utilisateur.
        </p>
        <p>
          En cas de litige, les parties s’efforceront de rechercher une solution amiable avant toute
          action judiciaire.
        </p>
      </article>
    </LegalPageTemplate>
  );
}
