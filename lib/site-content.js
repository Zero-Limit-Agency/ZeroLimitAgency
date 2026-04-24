export const SITE_CONTENT_KEY = "public_website_content";

const DEFAULT_REVIEWS = [
  {
    id: "review-1",
    name: "Retour Ã  confirmer",
    message:
      "Zero Limit Agency nous a aidÃ©s Ã  clarifier le projet, la posture et la maniÃ¨re de prÃ©senter notre valeur.",
    date: "Avril 2026",
    stars: 5
  },
  {
    id: "review-2",
    name: "Retour Ã  confirmer",
    message:
      "L'accompagnement a rendu notre image plus lisible, plus crÃ©dible et plus simple Ã  dÃ©velopper au quotidien.",
    date: "Avril 2026",
    stars: 5
  },
  {
    id: "review-3",
    name: "Retour Ã  confirmer",
    message:
      "Le mÃ©lange entre accompagnement, marketing et design donne un vrai cadre pour avancer sÃ©rieusement.",
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
      "Structuration d'un projet compÃ©titif, clarification du positionnement et montÃ©e en crÃ©dibilitÃ©.",
    date: "Avril 2026"
  },
  {
    id: "project-2",
    image: "",
    title: "DÃ©ploiement marketing",
    description:
      "Travail de visibilitÃ©, de discours et d'attractivitÃ© pour rendre un projet plus solide sur son marchÃ©.",
    date: "Avril 2026"
  },
  {
    id: "project-3",
    image: "",
    title: "IdentitÃ© & design",
    description:
      "CrÃ©ation d'une image cohÃ©rente et premium pour soutenir la perception du projet Ã  long terme.",
    date: "Avril 2026"
  }
];

const DEFAULT_NEWS = [
  {
    id: "news-1",
    image: "",
    title: "Zero Limit Agency structure sa nouvelle plateforme",
    description:
      "Une base pensÃ©e pour centraliser les demandes, les clients, les ressources et le suivi.",
    date: "Avril 2026"
  },
  {
    id: "news-2",
    image: "",
    title: "DÃ©ploiement du Zero Limit Market",
    description:
      "Un module de lecture du marchÃ© pensÃ© pour apporter une vision simple, lisible et exploitable.",
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
    description: "Coordination, Ã©changes rapides et suivi opÃ©rationnel."
  }
];

export const DEFAULT_SITE_CONTENT = {
  hero: {
    eyebrow: "Zero Limit Agency",
    title: "Construis tes projets sans limite",
    subtitle:
      "Zero Limit Agency accompagne managers, crÃ©ateurs et structures e-sport pour transformer une ambition en projet concret, structurÃ© et rentable.",
    button: "Rejoindre l'agence"
  },
  description: {
    title: "En savoir plus",
    paragraphs: [
      "Zero Limit Agency aide les talents Ã  passer d'une idÃ©e Ã  un vrai projet structurÃ©.",
      "Que tu sois manager, crÃ©ateur ou en train de lancer une structure, notre objectif est simple : te rendre indispensable.",
      "Nous combinons accompagnement, marketing et design pour te permettre de dÃ©velopper une image forte, une exÃ©cution propre et une vraie valeur sur ton marchÃ©.",
      "Ici, on ne vend pas du rÃªve. On construit des projets qui tiennent."
    ]
  },
  blocks: [
    {
      id: "block-1",
      title: "E-sport",
      text:
        "Structuration de projets e-sport, accompagnement des Ã©quipes et dÃ©veloppement d'une image professionnelle."
    },
    {
      id: "block-2",
      title: "Marketing",
      text:
        "Positionnement, stratÃ©gie de contenu et dÃ©veloppement de visibilitÃ© pour rendre un projet attractif et crÃ©dible."
    },
    {
      id: "block-3",
      title: "Design",
      text:
        "IdentitÃ© visuelle, branding et crÃ©ation graphique pour renforcer l'impact et la perception du projet."
    }
  ],
  media: [
    { id: "trailer", title: "Trailer" },
    { id: "interview", title: "Interview" },
    { id: "market", title: "Zero Limit Market" }
  ],
  clientArea: {
    title: "Espace client",
    paragraphs: [
      "Un espace dÃ©diÃ© pour suivre ton projet, accÃ©der Ã  tes ressources et centraliser toutes les informations importantes.",
      "Une fois connectÃ©, tu retrouves ton profil, tes dossiers, tes ressources, la timeline de ton accompagnement et tous les outils utiles Ã  ton Ã©volution."
    ],
    secondaryTitle: "AccÃ¨s structurÃ©",
    secondaryText:
      "Tous les Ã©lÃ©ments de ton projet sont regroupÃ©s au mÃªme endroit. Plus de perte d'information, tout est clair, organisÃ© et accessible Ã  tout moment.",
    button: "Se connecter"
  },
  reviews: {
    title: "Avis clients",
    text: "Des retours concrets de profils accompagnÃ©s par Zero Limit Agency.",
    items: DEFAULT_REVIEWS
  },
  projects: {
    title: "Projets",
    text:
      "Une sÃ©lection de projets accompagnÃ©s, montrant les rÃ©sultats concrets obtenus avec Zero Limit Agency.",
    items: DEFAULT_PROJECTS
  },
  news: {
    title: "ActualitÃ©s",
    text: "Les derniÃ¨res Ã©volutions de l'agence, projets en cours et coulisses.",
    items: DEFAULT_NEWS
  },
  partners: {
    title: "Outils & partenaires",
    text: "Les outils et partenaires utilisÃ©s pour accompagner les projets au quotidien.",
    items: DEFAULT_PARTNERS
  },
  faq: {
    title: "Questions frÃ©quentes",
    text: "Des rÃ©ponses claires aux questions les plus posÃ©es avant de rejoindre l'agence.",
    items: [
      {
        id: "faq-1",
        question: "Comment rejoindre Zero Limit Agency ?",
        answer:
          "Il suffit de remplir le formulaire d'inscription. L'Ã©quipe analyse ensuite la demande et revient vers vous rapidement."
      },
      {
        id: "faq-2",
        question: "Qui peut Ãªtre accompagnÃ© ?",
        answer:
          "Managers, crÃ©ateurs, structures e-sport et profils en dÃ©veloppement qui veulent structurer un projet sÃ©rieux."
      },
      {
        id: "faq-3",
        question: "Que trouve-t-on dans l'espace client ?",
        answer:
          "Le profil, les ressources utiles, le suivi du projet, les documents et les prochaines Ã©tapes de l'accompagnement."
      }
    ]
  },
  footer: {
    email: "contact@zerolimit.agency"
  }
};

function normalizeText(value, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
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
    name: normalizeText(item?.name, "Retour Ã  confirmer"),
    message: normalizeText(item?.message, "Avis Ã  complÃ©ter."),
    date: normalizeText(item?.date, "Date Ã  confirmer"),
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
    title: normalizeText(item?.title, "Titre Ã  complÃ©ter"),
    description: normalizeText(item?.description, "Description Ã  complÃ©ter."),
    date: normalizeText(item?.date, "Date Ã  prÃ©ciser")
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
    description: normalizeText(item?.description, "Description Ã  complÃ©ter.")
  }));
}

function normalizeFaq(items) {
  const defaults = DEFAULT_SITE_CONTENT.faq.items;

  if (!Array.isArray(items) || items.length === 0) {
    return defaults;
  }

  return items.map((item, index) => ({
    id: normalizeText(item?.id, `faq-${index + 1}`),
    question: normalizeText(item?.question, "Question Ã  complÃ©ter"),
    answer: normalizeText(item?.answer, "RÃ©ponse Ã  complÃ©ter.")
  }));
}

function normalizeBlocks(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return DEFAULT_SITE_CONTENT.blocks;
  }

  return items.map((item, index) => ({
    id: normalizeText(item?.id, `block-${index + 1}`),
    title: normalizeText(item?.title, "Bloc"),
    text: normalizeText(item?.text, "Texte Ã  complÃ©ter.")
  }));
}

function normalizeMedia(items) {
  const defaults = DEFAULT_SITE_CONTENT.media;

  if (!Array.isArray(items) || items.length === 0) {
    return defaults;
  }

  return defaults.map((defaultItem, index) => ({
    id: defaultItem.id,
    title: normalizeText(items[index]?.title, defaultItem.title)
  }));
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
    }
  };
}

