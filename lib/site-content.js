export const SITE_CONTENT_KEY = "public_website_content";

const DEFAULT_REVIEWS = [
  {
    id: "review-1",
    name: "Retour à confirmer",
    message:
      "Zero Limit Agency nous a aidés à clarifier le projet, la posture et la manière de présenter notre valeur.",
    date: "Avril 2026",
    stars: 5
  },
  {
    id: "review-2",
    name: "Retour à confirmer",
    message:
      "L'accompagnement a rendu notre image plus lisible, plus crédible et plus simple à développer au quotidien.",
    date: "Avril 2026",
    stars: 5
  },
  {
    id: "review-3",
    name: "Retour à confirmer",
    message:
      "Le mélange entre accompagnement, marketing et design donne un vrai cadre pour avancer sérieusement.",
    date: "Avril 2026",
    stars: 5
  }
];

const DEFAULT_PROJECTS = [
  {
    id: "project-1",
    image: "",
    title: "Accompagnement e-sport",
    description:
      "Structuration d'un projet compétitif, clarification du positionnement et montée en crédibilité.",
    date: "Avril 2026"
  },
  {
    id: "project-2",
    image: "",
    title: "Déploiement marketing",
    description:
      "Travail de visibilité, de discours et d'attractivité pour rendre un projet plus solide sur son marché.",
    date: "Avril 2026"
  },
  {
    id: "project-3",
    image: "",
    title: "Identité et design",
    description:
      "Création d'une image cohérente et premium pour soutenir la perception du projet à long terme.",
    date: "Avril 2026"
  }
];

const DEFAULT_NEWS = [
  {
    id: "news-1",
    image: "",
    title: "Zero Limit Agency structure sa nouvelle plateforme",
    description:
      "Une base pensée pour centraliser les demandes, les clients, les ressources et le suivi.",
    date: "Avril 2026"
  },
  {
    id: "news-2",
    image: "",
    title: "Déploiement du Zero Limit Market",
    description:
      "Un module de lecture du marché pensé pour apporter une vision simple, lisible et exploitable.",
    date: "Avril 2026"
  }
];

const DEFAULT_PARTNERS = [
  {
    id: "partner-1",
    logo: "",
    name: "Notion",
    description: "Organisation, documentation et suivi des projets."
  },
  {
    id: "partner-2",
    logo: "",
    name: "Google Drive",
    description: "Centralisation des documents et partage des ressources."
  },
  {
    id: "partner-3",
    logo: "",
    name: "Discord",
    description: "Coordination, échanges rapides et suivi opérationnel."
  }
];

export const DEFAULT_SITE_CONTENT = {
  hero: {
    eyebrow: "Zero Limit Agency",
    title: "Construis tes projets sans limites avec Zero Limit",
    subtitle:
      "Zero Limit Agency accompagne managers, créateurs et structures e-sport pour transformer une ambition en projet concret, structuré et rentable.",
    button: "Rejoindre l'agence"
  },
  description: {
    title: "En savoir plus",
    paragraphs: [
      "Zero Limit Agency aide les talents à passer d'une idée à un vrai projet structuré.",
      "Que tu sois manager, créateur ou en train de lancer une structure, notre objectif est simple : te rendre indispensable.",
      "Nous combinons accompagnement, marketing et design pour te permettre de développer une image forte, une exécution propre et une vraie valeur sur ton marché.",
      "Ici, on ne vend pas du rêve. On construit des projets qui tiennent."
    ]
  },
  blocks: [
    {
      id: "block-1",
      title: "E-sport",
      text:
        "Structuration de projets e-sport, accompagnement des équipes et développement d'une image professionnelle."
    },
    {
      id: "block-2",
      title: "Marketing",
      text:
        "Positionnement, stratégie de contenu et développement de visibilité pour rendre un projet attractif et crédible."
    },
    {
      id: "block-3",
      title: "Design",
      text:
        "Identité visuelle, branding et création graphique pour renforcer l'impact et la perception du projet."
    }
  ],
  media: [
    { id: "trailer", title: "Trailer" }
  ],
  clientArea: {
    title: "Espace client",
    paragraphs: [
      "Un espace dédié pour suivre ton projet, accéder à tes ressources et centraliser toutes les informations importantes.",
      "Une fois connecté, tu retrouves ton profil, tes dossiers, tes ressources, le suivi de ton accompagnement et tous les outils utiles à ton évolution."
    ],
    secondaryTitle: "Accès structuré",
    secondaryText:
      "Tous les éléments de ton projet sont regroupés au même endroit. Plus de perte d'information, tout est clair, organisé et accessible à tout moment.",
    button: "Se connecter"
  },
  reviews: {
    title: "Avis clients",
    text: "Des retours concrets de profils accompagnés par Zero Limit Agency.",
    items: DEFAULT_REVIEWS
  },
  projects: {
    title: "Projets",
    text:
      "Une sélection de projets accompagnés, montrant les résultats concrets obtenus avec Zero Limit Agency.",
    items: DEFAULT_PROJECTS
  },
  news: {
    title: "Actualités",
    text: "Les dernières évolutions de l'agence, projets en cours et coulisses.",
    items: DEFAULT_NEWS
  },
  partners: {
    title: "Outils et partenaires",
    text: "Les outils et partenaires utilisés pour accompagner les projets au quotidien.",
    items: DEFAULT_PARTNERS
  },
  faq: {
    title: "Questions fréquentes",
    text: "Des réponses claires aux questions les plus posées avant de rejoindre l'agence.",
    items: [
      {
        id: "faq-1",
        question: "Comment rejoindre Zero Limit Agency ?",
        answer:
          "Il suffit de remplir le formulaire d'inscription. L'équipe analyse ensuite la demande et revient vers vous rapidement."
      },
      {
        id: "faq-2",
        question: "Qui peut être accompagné ?",
        answer:
          "Managers, créateurs, structures e-sport et profils en développement qui veulent structurer un projet sérieux."
      },
      {
        id: "faq-3",
        question: "Que trouve-t-on dans l'espace client ?",
        answer:
          "Le profil, les ressources utiles, le suivi du projet, les documents et les prochaines étapes de l'accompagnement."
      }
    ]
  },
  footer: {
    email: "contact@zerolimit.agency"
  },
  support: {
    contactEmail: "contact@zerolimit.agency",
    discordUrl: ""
  }
};

function normalizeText(value, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

export function normalizeSupportSettings(source) {
  const settings = source && typeof source === "object" ? source : {};

  return {
    contactEmail: normalizeText(settings?.contactEmail, DEFAULT_SITE_CONTENT.support.contactEmail),
    discordUrl: normalizeText(settings?.discordUrl, DEFAULT_SITE_CONTENT.support.discordUrl)
  };
}

function normalizeStringArray(value, fallback) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const items = value.map((item) => normalizeText(item)).filter(Boolean);
  return items.length > 0 ? items : fallback;
}

function normalizeReviews(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return DEFAULT_REVIEWS;
  }

  return items.map((item, index) => ({
    id: normalizeText(item?.id, `review-${index + 1}`),
    name: normalizeText(item?.name, "Retour à confirmer"),
    message: normalizeText(item?.message, "Avis à compléter."),
    date: normalizeText(item?.date, "Date à confirmer"),
    stars: Math.min(Math.max(Number(item?.stars || 5), 1), 5)
  }));
}

function normalizeProjects(items, fallback) {
  if (!Array.isArray(items) || items.length === 0) {
    return fallback;
  }

  return items.map((item, index) => ({
    id: normalizeText(item?.id, `${fallback === DEFAULT_NEWS ? "news" : "project"}-${index + 1}`),
    image: normalizeText(item?.image),
    title: normalizeText(item?.title, "Titre à compléter"),
    description: normalizeText(item?.description, "Description à compléter."),
    date: normalizeText(item?.date, "Date à préciser")
  }));
}

function normalizePartners(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return DEFAULT_PARTNERS;
  }

  return items.map((item, index) => ({
    id: normalizeText(item?.id, `partner-${index + 1}`),
    logo: normalizeText(item?.logo),
    name: normalizeText(item?.name, "Partenaire"),
    description: normalizeText(item?.description, "Description à compléter.")
  }));
}

function normalizeFaq(items) {
  const defaults = DEFAULT_SITE_CONTENT.faq.items;

  if (!Array.isArray(items) || items.length === 0) {
    return defaults;
  }

  return items.map((item, index) => ({
    id: normalizeText(item?.id, `faq-${index + 1}`),
    question: normalizeText(item?.question, "Question à compléter"),
    answer: normalizeText(item?.answer, "Réponse à compléter.")
  }));
}

function normalizeBlocks(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return DEFAULT_SITE_CONTENT.blocks;
  }

  return items.map((item, index) => ({
    id: normalizeText(item?.id, `block-${index + 1}`),
    title: normalizeText(item?.title, "Bloc"),
    text: normalizeText(item?.text, "Texte à compléter.")
  }));
}

function normalizeMedia(items) {
  const defaults = DEFAULT_SITE_CONTENT.media;

  if (!Array.isArray(items) || items.length === 0) {
    return defaults;
  }

  return [
    {
      id: defaults[0].id,
      title: normalizeText(items[0]?.title, defaults[0].title)
    }
  ];
}

export function normalizeSiteContent(source) {
  const settings =
    source && typeof source === "object"
      ? source.settings && typeof source.settings === "object"
        ? source.settings
        : source
      : {};

  return {
    hero: {
      eyebrow: normalizeText(settings?.hero?.eyebrow, DEFAULT_SITE_CONTENT.hero.eyebrow),
      title: normalizeText(settings?.hero?.title, DEFAULT_SITE_CONTENT.hero.title),
      subtitle: normalizeText(settings?.hero?.subtitle, DEFAULT_SITE_CONTENT.hero.subtitle),
      button: normalizeText(settings?.hero?.button, DEFAULT_SITE_CONTENT.hero.button)
    },
    description: {
      title: normalizeText(settings?.description?.title, DEFAULT_SITE_CONTENT.description.title),
      paragraphs: normalizeStringArray(
        settings?.description?.paragraphs,
        DEFAULT_SITE_CONTENT.description.paragraphs
      )
    },
    blocks: normalizeBlocks(settings?.blocks),
    media: normalizeMedia(settings?.media),
    clientArea: {
      title: normalizeText(settings?.clientArea?.title, DEFAULT_SITE_CONTENT.clientArea.title),
      paragraphs: normalizeStringArray(
        settings?.clientArea?.paragraphs,
        DEFAULT_SITE_CONTENT.clientArea.paragraphs
      ),
      secondaryTitle: normalizeText(
        settings?.clientArea?.secondaryTitle,
        DEFAULT_SITE_CONTENT.clientArea.secondaryTitle
      ),
      secondaryText: normalizeText(
        settings?.clientArea?.secondaryText,
        DEFAULT_SITE_CONTENT.clientArea.secondaryText
      ),
      button: normalizeText(settings?.clientArea?.button, DEFAULT_SITE_CONTENT.clientArea.button)
    },
    reviews: {
      title: normalizeText(settings?.reviews?.title, DEFAULT_SITE_CONTENT.reviews.title),
      text: normalizeText(settings?.reviews?.text, DEFAULT_SITE_CONTENT.reviews.text),
      items: normalizeReviews(settings?.reviews?.items)
    },
    projects: {
      title: normalizeText(settings?.projects?.title, DEFAULT_SITE_CONTENT.projects.title),
      text: normalizeText(settings?.projects?.text, DEFAULT_SITE_CONTENT.projects.text),
      items: normalizeProjects(settings?.projects?.items, DEFAULT_PROJECTS)
    },
    news: {
      title: normalizeText(settings?.news?.title, DEFAULT_SITE_CONTENT.news.title),
      text: normalizeText(settings?.news?.text, DEFAULT_SITE_CONTENT.news.text),
      items: normalizeProjects(settings?.news?.items, DEFAULT_NEWS)
    },
    partners: {
      title: normalizeText(settings?.partners?.title, DEFAULT_SITE_CONTENT.partners.title),
      text: normalizeText(settings?.partners?.text, DEFAULT_SITE_CONTENT.partners.text),
      items: normalizePartners(settings?.partners?.items)
    },
    faq: {
      title: normalizeText(settings?.faq?.title, DEFAULT_SITE_CONTENT.faq.title),
      text: normalizeText(settings?.faq?.text, DEFAULT_SITE_CONTENT.faq.text),
      items: normalizeFaq(settings?.faq?.items)
    },
    footer: {
      email: normalizeText(settings?.footer?.email, DEFAULT_SITE_CONTENT.footer.email)
    },
    support: normalizeSupportSettings(settings?.support)
  };
}
