export const learnYoutubeNavItems = [
  { href: "#programme", label: "Programme" },
  { href: "#fonctionnement", label: "Expérience" },
  { href: "#formateurs", label: "Formateurs" },
  { href: "#offres", label: "Offres" },
  { href: "#faq", label: "FAQ" }
];

export const learnYoutubeHighlights = [
  "4 packs spécialisés",
  "Pack → Module → Leçon",
  "Progression sauvegardée",
  "Ressources liées aux cours"
];

export const learnYoutubeHowItWorks = [
  {
    title: "Choisissez votre parcours",
    description: "Sélectionnez un pack précis ou préparez une progression complète autour des quatre axes de la Formation YouTube.",
    visual: "path"
  },
  {
    title: "Accédez à vos modules",
    description: "Chaque pack est pensé pour regrouper modules, leçons, ressources et repères pédagogiques dans un espace clair.",
    visual: "modules"
  },
  {
    title: "Progressez à votre rythme",
    description: "L'expérience prévue réunit reprise de lecture, progression, favoris, notes privées, ressources et commentaires.",
    visual: "progress"
  }
];

export const learnYoutubePacks = [
  {
    title: "Montage",
    price: "100 €",
    description:
      "Organiser ses rushs, construire une timeline propre et donner du rythme à ses vidéos, avec une attention particulière aux formats Gaming et IRL.",
    themes: ["Timeline", "Rythme", "Gaming & IRL", "Sound design"],
    visual: "editing"
  },
  {
    title: "Graphisme",
    price: "100 €",
    description:
      "Travailler les miniatures, la composition, les couleurs, la typographie et l'identité visuelle d'une chaîne YouTube.",
    themes: ["Miniatures", "Composition", "Contraste", "Identité"],
    visual: "design"
  },
  {
    title: "Monétisation",
    price: "100 €",
    description:
      "Comprendre les partenariats, les offres commerciales, la tarification et l'organisation nécessaire pour professionnaliser un projet.",
    themes: ["Partenariats", "Offres", "Tarification", "Organisation"],
    visual: "business"
  },
  {
    title: "Se lancer / Les bases",
    price: "100 €",
    description:
      "Définir son positionnement, préparer ses premières vidéos, organiser son calendrier et donner une direction claire au projet.",
    themes: ["Positionnement", "Premières vidéos", "Calendrier", "Stratégie"],
    visual: "launch"
  }
];

export const learnYoutubeTrainerSlots = [
  { specialty: "Montage", pack: "Pack Montage" },
  { specialty: "Graphisme", pack: "Pack Graphisme" },
  { specialty: "Stratégie & développement", pack: "Packs Monétisation / Bases" }
];

export const learnYoutubeOffers = [
  {
    name: "Pack indépendant",
    price: "100 €",
    description: "Un pack au choix pour travailler une compétence prioritaire dans un espace de formation dédié.",
    items: ["Un pack au choix", "Contenu du pack", "Espace de formation", "Ressources associées"],
    cta: "Voir le programme"
  },
  {
    name: "Formation complète basique",
    price: "320 €",
    description: "L'offre principale pour accéder aux quatre packs et aux contenus communs de la Formation YouTube.",
    items: ["Quatre packs", "Contenus communs", "Structure Pack → Module → Leçon", "Ressources prévues"],
    cta: "Ouverture prochainement",
    highlighted: true
  },
  {
    name: "Formation complète premium",
    price: "Tarif en validation",
    description: "Une version complète avec avantages premium en préparation, non ouverte tant que les conditions ne sont pas validées.",
    items: ["Quatre packs", "Contenus premium prévus", "Jusqu'à trois demandes de call 1:1 selon les futures conditions"],
    cta: "En préparation"
  }
];

export const learnYoutubeFaq = [
  {
    question: "Puis-je acheter un seul pack ?",
    answer: "Oui. Chaque pack pourra être acheté séparément."
  },
  {
    question: "Quelle est la différence entre un pack et la formation complète ?",
    answer: "Un pack indépendant donne accès à une thématique. La formation complète regroupe les différents packs."
  },
  {
    question: "Est-ce qu'un compte Zero Limit suffit pour accéder à la formation ?",
    answer: "Non. Le compte permet de se connecter, mais l'accès aux contenus dépend d'un achat ou d'une autorisation accordée par Zero Limit."
  },
  {
    question: "La Formation complète premium est-elle déjà disponible ?",
    answer: "L'offre premium est encore en cours de finalisation. Son contenu précis et son tarif seront confirmés avant son ouverture."
  },
  {
    question: "Où seront accessibles les cours ?",
    answer: "Les cours seront accessibles dans un espace Formation YouTube relié au compte Zero Limit."
  },
  {
    question: "Les vidéos seront-elles téléchargeables ?",
    answer: "Les vidéos seront visionnées depuis un lecteur sécurisé. Certaines ressources complémentaires pourront être téléchargées lorsqu'elles sont prévues dans une leçon."
  }
];
