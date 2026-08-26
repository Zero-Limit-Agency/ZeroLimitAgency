import { LegalPageTemplate } from "@/components/legal/legal-page-template";

export const metadata = {
  title: "Mentions légales | Zero Limit Agency",
  description: "Informations relatives à l’édition, l’hébergement et l’utilisation du site Zero Limit Agency."
};

const LAST_UPDATED = "8 mai 2026 à 19:20";

export default function MentionsLegalesPage() {
  return (
    <LegalPageTemplate
      eyebrow="Site"
      title="Mentions légales"
      lead="Informations juridiques générales relatives au site Zero Limit Agency, à son éditeur, à son hébergement et à son fonctionnement."
      lastUpdated={LAST_UPDATED}
    >
      <article className="legal-page-card">
        <h2>1. Éditeur du site</h2>
        <p>
          Le site <strong>Zero Limit Agency</strong>, accessible à l’adresse{" "}
          <strong>https://zerolimit.agency</strong>, est édité par une personne physique.
        </p>
        <p>
          À ce jour, <strong>Zero Limit Agency</strong> est un projet indépendant en cours de
          structuration administrative. Le site ne représente pas une société immatriculée, ne
          dispose pas de numéro SIRET affiché et ne constitue pas, à ce stade, une entité juridique
          distincte.
        </p>
        <p>
          Pour des raisons de confidentialité, l’identité complète de l’éditeur n’est pas affichée
          publiquement sur cette page. Toute demande relative au site, à son contenu ou à son
          fonctionnement peut être adressée à l’adresse suivante :
        </p>
        <p>
          <strong>Email de contact :</strong> contact@zerolimit.agency
        </p>
      </article>

      <article className="legal-page-card">
        <h2>2. Directeur de la publication</h2>
        <p>Le directeur de la publication est l’éditeur du site.</p>
        <p>
          <strong>Contact :</strong> contact@zerolimit.agency
        </p>
      </article>

      <article className="legal-page-card">
        <h2>3. Hébergement</h2>
        <p>Le site est hébergé par :</p>
        <p>
          <strong>Vercel Inc.</strong>
          <br />
          Service d’hébergement et de déploiement web
          <br />
          Site web : https://vercel.com
          <br />
          Informations légales de l’hébergeur : https://vercel.com/legal
        </p>
      </article>

      <article className="legal-page-card">
        <h2>4. Objet du site</h2>
        <p>
          Le site <strong>Zero Limit Agency</strong> a pour objet de présenter un projet, des
          services, des contenus, des ressources et un espace client autour de l’accompagnement, de
          la formation, de l’intelligence artificielle, de l’automatisation et de la structuration
          de projets digitaux.
        </p>
        <p>
          Le site peut permettre aux utilisateurs de créer un profil client, de transmettre certaines
          informations personnelles, d’exprimer une demande particulière et, le cas échéant, de
          s’inscrire à une newsletter.
        </p>
      </article>

      <article className="legal-page-card">
        <h2>5. Absence de vente directe sur le site</h2>
        <p>
          Le site <strong>zerolimit.agency</strong> ne permet pas, à ce jour, de passer une commande
          ferme ni d’effectuer un paiement directement en ligne.
        </p>
        <p>
          Les éventuels échanges commerciaux, propositions, formations, prestations ou paiements sont
          réalisés en dehors du site, après échange direct avec l’utilisateur.
        </p>
        <p>
          Lorsqu’un paiement est proposé, il peut notamment être transmis par un lien de paiement
          externe, par exemple via Stripe, après discussion préalable. Ce paiement ne constitue pas
          une commande automatique réalisée directement depuis le site.
        </p>
      </article>

      <article className="legal-page-card">
        <h2>6. Propriété intellectuelle</h2>
        <p>
          L’ensemble des éléments présents sur le site <strong>Zero Limit Agency</strong>, notamment
          les textes, interfaces, graphismes, logos, structures de pages, éléments visuels, contenus,
          méthodes, noms, marques, bases de données et éléments techniques, sont protégés par le
          droit de la propriété intellectuelle, sauf mention contraire.
        </p>
        <p>
          Toute reproduction, représentation, modification, adaptation, diffusion, extraction ou
          réutilisation totale ou partielle du contenu du site, sans autorisation préalable, est
          interdite.
        </p>
        <p>
          Toute utilisation non autorisée du site ou de l’un de ses contenus pourra engager la
          responsabilité de l’utilisateur.
        </p>
      </article>

      <article className="legal-page-card">
        <h2>7. Responsabilité</h2>
        <p>
          L’éditeur du site s’efforce de fournir des informations aussi exactes et à jour que
          possible. Toutefois, les informations publiées sur le site sont fournies à titre informatif
          et peuvent être modifiées à tout moment.
        </p>
        <p>
          L’éditeur ne garantit pas que les informations présentes sur le site soient complètes,
          exactes, actualisées ou adaptées à la situation particulière de chaque utilisateur.
        </p>
        <p>
          Les contenus publiés sur le site ne constituent pas un conseil juridique, fiscal,
          financier, comptable ou administratif personnalisé. L’utilisateur reste seul responsable de
          ses décisions, démarches, déclarations, choix professionnels, administratifs ou
          entrepreneuriaux.
        </p>
      </article>

      <article className="legal-page-card">
        <h2>8. Accès au site</h2>
        <p>
          L’éditeur s’efforce de maintenir le site accessible, mais ne garantit pas un accès
          permanent, continu ou sans erreur.
        </p>
        <p>
          L’accès au site peut être suspendu, limité ou interrompu à tout moment, notamment pour des
          raisons de maintenance, de sécurité, de mise à jour, de problème technique, d’hébergement ou
          de force majeure.
        </p>
        <p>
          L’éditeur ne pourra être tenu responsable des conséquences liées à une indisponibilité
          temporaire ou permanente du site.
        </p>
      </article>

      <article className="legal-page-card">
        <h2>9. Services tiers</h2>
        <p>
          Le site peut s’appuyer sur des services tiers nécessaires à son fonctionnement, notamment
          des services d’hébergement, d’authentification, d’envoi d’emails, d’analyse technique,
          d’intelligence artificielle ou de traitement de paiements externes.
        </p>
        <p>
          Certains traitements peuvent notamment impliquer des outils d’intelligence artificielle tels
          que <strong>OpenAI / ChatGPT</strong>, afin d’aider à résumer, structurer ou analyser
          certaines informations fournies par l’utilisateur.
        </p>
        <p>
          Les conditions d’utilisation et politiques de confidentialité propres à ces services tiers
          peuvent également s’appliquer.
        </p>
      </article>

      <article className="legal-page-card">
        <h2>10. Données personnelles</h2>
        <p>
          Le site peut collecter et traiter certaines données personnelles, notamment dans le cadre de
          la création d’un profil client, d’une demande particulière ou d’une inscription à la
          newsletter.
        </p>
        <p>Les informations relatives au traitement des données personnelles sont détaillées dans la page :</p>
        <p>
          <strong>Politique de confidentialité</strong>
        </p>
        <p>
          Pour toute demande relative aux données personnelles, l’utilisateur peut contacter :
        </p>
        <p>
          <strong>contact@zerolimit.agency</strong>
        </p>
      </article>

      <article className="legal-page-card">
        <h2>11. Signalement</h2>
        <p>
          Pour signaler un contenu, un problème technique, une erreur, une demande relative au site ou
          une atteinte à des droits, l’utilisateur peut écrire à :
        </p>
        <p>
          <strong>contact@zerolimit.agency</strong>
        </p>
      </article>

      <article className="legal-page-card">
        <h2>12. Droit applicable</h2>
        <p>
          Les présentes mentions légales sont régies par le droit français, sous réserve des règles
          impératives applicables selon la situation de l’utilisateur.
        </p>
        <p>
          En cas de litige, les parties s’efforceront de rechercher une solution amiable avant toute
          action judiciaire.
        </p>
      </article>
    </LegalPageTemplate>
  );
}
