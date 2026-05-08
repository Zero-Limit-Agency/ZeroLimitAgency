import { LegalPageTemplate } from "@/components/legal/legal-page-template";

export const metadata = {
  title: "Politique de remboursement | Zero Limit Agency"
};

const LAST_UPDATED = "8 mai 2026 à 19:28";

export default function PolitiqueRemboursementPage() {
  return (
    <LegalPageTemplate
      eyebrow="Site"
      title="Politique de remboursement"
      lead="Cette page explique les conditions applicables aux éventuelles demandes d’annulation ou de remboursement liées aux échanges, formations, accompagnements ou prestations présentés par Zero Limit Agency."
      lastUpdated={LAST_UPDATED}
    >
      <article className="legal-page-card">
        <p>
          La présente politique de remboursement a pour objet d’expliquer les conditions applicables
          aux éventuelles demandes d’annulation ou de remboursement liées aux échanges, formations,
          accompagnements ou prestations présentés par <strong>Zero Limit Agency</strong>, accessible
          à l’adresse <strong>https://zerolimit.agency</strong>.
        </p>
        <p>
          À ce jour, <strong>Zero Limit Agency</strong> est un projet indépendant en cours de
          structuration administrative. Le site ne représente pas une société immatriculée et ne
          permet pas de passer commande ou d’effectuer un paiement directement en ligne.
        </p>
        <p>Pour toute question générale, l’utilisateur peut contacter :</p>
        <p>
          <strong>contact@zerolimit.agency</strong>
        </p>
        <p>
          Pour toute demande liée à un compte client, à une demande client, à un paiement externe, à
          une annulation ou à un remboursement, l’utilisateur peut contacter :
        </p>
        <p>
          <strong>clients@zerolimit.agency</strong>
        </p>
      </article>

      <article className="legal-page-card">
        <h2>1. Absence de paiement direct sur le site</h2>
        <p>Le site <strong>zerolimit.agency</strong> ne permet pas, à ce jour :</p>
        <ul>
          <li>de passer commande directement en ligne ;</li>
          <li>d’acheter une prestation via un panier ;</li>
          <li>de souscrire automatiquement à une offre payante ;</li>
          <li>d’effectuer un paiement directement depuis le site ;</li>
          <li>de recevoir une confirmation automatique de commande.</li>
        </ul>
        <p>
          En conséquence, aucune politique de remboursement automatique liée à un achat effectué
          directement sur le site ne s’applique.
        </p>
      </article>

      <article className="legal-page-card">
        <h2>2. Paiements réalisés hors site</h2>
        <p>
          Certains paiements peuvent éventuellement être proposés en dehors du site, après échange
          direct avec l’utilisateur.
        </p>
        <p>
          Ces paiements peuvent notamment être réalisés via un lien de paiement externe, par exemple{" "}
          <strong>Stripe</strong>, transmis après discussion préalable.
        </p>
        <p>
          Dans ce cas, le paiement est traité par le prestataire de paiement concerné, selon ses
          propres conditions d’utilisation, règles de sécurité et politique de confidentialité.
        </p>
        <p>
          Zero Limit Agency ne collecte pas directement les numéros complets de carte bancaire via le
          site.
        </p>
      </article>

      <article className="legal-page-card">
        <h2>3. Conditions communiquées avant paiement</h2>
        <p>
          Lorsqu’une formation, un accompagnement, une prestation ou tout autre service est proposé
          hors site, les conditions applicables doivent être précisées avant le paiement ou au moment
          de la proposition.
        </p>
        <p>Ces conditions peuvent notamment préciser :</p>
        <ul>
          <li>la nature de la prestation ou de la formation ;</li>
          <li>le prix ;</li>
          <li>les modalités de paiement ;</li>
          <li>les délais ou modalités d’exécution ;</li>
          <li>les conditions d’annulation ;</li>
          <li>les conditions de remboursement ;</li>
          <li>les éventuelles limites ou exclusions.</li>
        </ul>
        <p>
          L’utilisateur est invité à demander toute clarification nécessaire avant d’effectuer un
          paiement.
        </p>
      </article>

      <article className="legal-page-card">
        <h2>4. Demande d’annulation avant paiement</h2>
        <p>
          Tant qu’aucun paiement n’a été effectué, l’utilisateur peut renoncer à poursuivre un échange,
          une demande, une proposition ou une prise de contact sans frais.
        </p>
        <p>
          La création d’un compte, l’envoi d’une demande ou l’échange avec Zero Limit Agency ne vaut
          pas automatiquement commande.
        </p>
      </article>

      <article className="legal-page-card">
        <h2>5. Demande d’annulation après paiement</h2>
        <p>Lorsqu’un paiement a été réalisé hors site, toute demande d’annulation doit être adressée à :</p>
        <p>
          <strong>clients@zerolimit.agency</strong>
        </p>
        <p>La demande doit préciser, lorsque cela est possible :</p>
        <ul>
          <li>le nom et prénom utilisés lors de l’échange ;</li>
          <li>l’adresse email utilisée ;</li>
          <li>la date approximative du paiement ;</li>
          <li>le service, la formation ou l’accompagnement concerné ;</li>
          <li>le motif de la demande.</li>
        </ul>
        <p>
          La demande sera étudiée au cas par cas, en fonction des conditions communiquées au moment de
          la proposition et de l’état d’avancement éventuel du service.
        </p>
      </article>

      <article className="legal-page-card">
        <h2>6. Remboursement avant le début d’une prestation</h2>
        <p>
          Lorsqu’un paiement a été effectué hors site et que la prestation, formation ou accompagnement
          n’a pas encore commencé, une demande de remboursement peut être étudiée.
        </p>
        <p>Le remboursement peut être accepté, refusé ou partiel selon :</p>
        <ul>
          <li>les conditions précisées avant le paiement ;</li>
          <li>la nature de la prestation ;</li>
          <li>les éventuels frais déjà engagés ;</li>
          <li>le délai écoulé depuis le paiement ;</li>
          <li>l’organisation déjà mise en place.</li>
        </ul>
      </article>

      <article className="legal-page-card">
        <h2>7. Remboursement après le début d’une prestation</h2>
        <p>
          Lorsque la prestation, formation ou accompagnement a déjà commencé, le remboursement n’est
          pas automatique.
        </p>
        <p>La demande peut être refusée ou faire l’objet d’un remboursement partiel, notamment si :</p>
        <ul>
          <li>un appel a déjà eu lieu ;</li>
          <li>un accompagnement a déjà commencé ;</li>
          <li>une analyse, préparation ou personnalisation a déjà été réalisée ;</li>
          <li>des contenus, ressources ou recommandations ont déjà été transmis ;</li>
          <li>du temps a déjà été consacré à la demande ;</li>
          <li>des frais techniques, administratifs ou organisationnels ont déjà été engagés.</li>
        </ul>
      </article>

      <article className="legal-page-card">
        <h2>8. Contenus numériques, formations et ressources transmises</h2>
        <p>
          Lorsqu’un contenu numérique, une ressource, un document, une formation, un accès, une
          analyse ou un support personnalisé a déjà été transmis à l’utilisateur, aucun remboursement
          automatique n’est garanti.
        </p>
        <p>
          Toute demande sera étudiée au cas par cas, notamment selon la nature du contenu transmis, son
          niveau de personnalisation et les conditions communiquées avant paiement.
        </p>
      </article>

      <article className="legal-page-card">
        <h2>9. Absence de garantie de résultat</h2>
        <p>
          Aucun remboursement ne peut être exigé uniquement au motif que l’utilisateur n’a pas obtenu
          un résultat personnel, financier, commercial, administratif, entrepreneurial ou autre
          résultat attendu, sauf engagement écrit contraire.
        </p>
        <p>
          Les informations, formations, accompagnements ou contenus éventuellement proposés ne
          garantissent aucun résultat précis.
        </p>
        <p>
          L’utilisateur reste responsable de ses décisions, de ses démarches, de son implication, de
          son application des informations reçues et du respect des règles applicables à sa situation.
        </p>
      </article>

      <article className="legal-page-card">
        <h2>10. Frais Stripe ou frais de paiement</h2>
        <p>
          Lorsque le paiement a été réalisé via un prestataire externe tel que Stripe, certains frais
          techniques ou frais de transaction peuvent s’appliquer selon les règles du prestataire.
        </p>
        <p>
          En cas de remboursement accepté, le montant remboursé peut, lorsque cela est applicable,
          être diminué des frais non récupérables ou déjà facturés par le prestataire de paiement.
        </p>
      </article>

      <article className="legal-page-card">
        <h2>11. Délai de traitement des demandes</h2>
        <p>
          Les demandes d’annulation ou de remboursement sont traitées dans un délai raisonnable après
          réception de l’ensemble des informations nécessaires.
        </p>
        <p>
          Si un remboursement est accepté, le délai d’apparition des fonds sur le moyen de paiement de
          l’utilisateur dépend du prestataire de paiement utilisé et de l’établissement bancaire
          concerné.
        </p>
      </article>

      <article className="legal-page-card">
        <h2>12. Cas d’exclusion</h2>
        <p>Une demande de remboursement peut notamment être refusée en cas de :</p>
        <ul>
          <li>demande abusive ou frauduleuse ;</li>
          <li>informations fausses ou trompeuses fournies par l’utilisateur ;</li>
          <li>non-respect des conditions communiquées avant paiement ;</li>
          <li>prestation déjà exécutée en totalité ou en grande partie ;</li>
          <li>contenu numérique ou personnalisé déjà transmis ;</li>
          <li>absence de réponse de l’utilisateur empêchant la bonne exécution du service ;</li>
          <li>comportement contraire aux Conditions générales d’utilisation.</li>
        </ul>
      </article>

      <article className="legal-page-card">
        <h2>13. Contact</h2>
        <p>
          Pour toute demande liée à une annulation, un paiement externe ou un remboursement,
          l’utilisateur peut contacter :
        </p>
        <p>
          <strong>clients@zerolimit.agency</strong>
        </p>
        <p>Pour toute question générale relative au site :</p>
        <p>
          <strong>contact@zerolimit.agency</strong>
        </p>
      </article>

      <article className="legal-page-card">
        <h2>14. Modification de la politique de remboursement</h2>
        <p>
          La présente politique de remboursement peut être modifiée à tout moment afin de tenir compte
          de l’évolution du site, du projet, des services proposés, des outils utilisés ou de la
          réglementation applicable.
        </p>
        <p>
          La date de dernière mise à jour indiquée en haut de la page permet d’identifier la version
          applicable.
        </p>
      </article>

      <article className="legal-page-card">
        <h2>15. Droit applicable</h2>
        <p>
          La présente politique de remboursement est régie par le droit français, sous réserve des
          règles impératives applicables selon la situation de l’utilisateur.
        </p>
        <p>
          En cas de litige, les parties s’efforceront de rechercher une solution amiable avant toute
          action judiciaire.
        </p>
      </article>
    </LegalPageTemplate>
  );
}
