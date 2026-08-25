import { defaultLocale, resolveLocale } from "./config";

const dictionaries = {
  fr: {
    common: {
      skipToContent: "Aller au contenu",
      loading: "Chargement"
    },
    marketing: {
      nav: { login: "Connexion", cta: "Choisir mon espace", links: [{ label: "Écosystème", href: "#ecosystem" }, { label: "Espaces", href: "#spaces" }, { label: "Outils", href: "#tools" }, { label: "Tarifs", href: "#pricing" }] },
      hero: { eyebrow: "L’écosystème des professionnels esport", title: "Votre ambition mérite une structure.", copy: "Zero Limit réunit accompagnement, outils et réseau dans un espace conçu pour celles et ceux qui font avancer l’esport.", primary: "Découvrir les espaces", secondary: "Explorer l’écosystème" },
      proof: [{ value: "6 espaces", label: "selon votre métier", note: "Une fondation commune, des usages dédiés" }, { value: "En direct", label: "conférences et échanges", note: "Programme présenté avant chaque session" }, { value: "FR / EN", label: "structure bilingue", note: "Déploiement des langues par étapes" }],
      problem: { eyebrow: "Le constat", title: "Le talent ne suffit pas sans cadre.", copy: "Les métiers de l’esport avancent encore avec des outils fragmentés, des contacts dispersés et trop peu de visibilité sur la prochaine étape.", cards: [["chart","Une progression difficile à lire","Objectifs, missions et résultats vivent souvent dans des outils séparés."],["users","Un réseau peu qualifié","Trouver le bon expert ou collaborateur demande du temps et de la confiance."],["layers","Trop de dispersion","Les opérations quotidiennes éloignent les professionnels de leur vraie valeur."]] },
      solution: { eyebrow: "La réponse Zero Limit", title: "Un seul écosystème. Plusieurs façons d’avancer.", copy: "Une infrastructure claire pour structurer son activité, activer les bonnes ressources et construire une trajectoire durable." },
      spaces: { eyebrow: "Choisir son espace", title: "Conçu autour de votre rôle.", copy: "Chaque espace adapte les priorités, les outils et les vues à votre réalité professionnelle.", items: [["Coach","Cadrez les suivis, séances et plans de progression."],["Manager / Agent","Centralisez talents, opportunités et collaborations."],["CEO / Dirigeant","Gardez une vue claire sur l’organisation et sa croissance."],["Community Manager","Planifiez, produisez et mesurez votre stratégie éditoriale."],["Creator","Structurez vos contenus, partenariats et objectifs."],["Team","Alignez les membres, les projets et les décisions."]] },
      tools: { eyebrow: "Outils", title: "Moins d’onglets. Plus de maîtrise.", copy: "Tableaux de bord, workflows, ressources et signaux utiles réunis dans une interface calme et actionnable.", items: [["chart","Pilotage","Des objectifs visibles et des indicateurs lisibles."],["calendar","Organisation","Les échéances, sessions et actions au même endroit."],["users","Collaboration","Un contexte partagé pour prendre de meilleures décisions."]] },
      ai: { eyebrow: "Zero Limit AI", title: "Une assistance qui éclaire, sans décider à votre place.", copy: "Zero Limit AI aide à synthétiser, préparer et organiser vos informations. Les recommandations restent explicables, révisables et sous votre contrôle.", points: ["Synthèses à partir de votre contexte", "Aide à la préparation et à la rédaction", "Validation humaine avant toute action"] },
      conferences: { eyebrow: "Conférences", title: "Apprendre de celles et ceux qui pratiquent.", copy: "Des sessions en direct, leurs rediffusions et des interventions d’experts pour transformer l’expérience du terrain en décisions concrètes.", live: "Sessions live", replay: "Bibliothèque de rediffusions", expert: "Experts & Certified" },
      team: { eyebrow: "Espace Team", title: "Une vision partagée, du terrain à la direction.", copy: "Rassemblez les rôles, les objectifs et les projets sans perdre le contexte. Chacun voit ce qui compte pour lui, l’organisation garde une trajectoire commune." },
      certified: { eyebrow: "Certified", title: "La confiance commence par des repères clairs.", copy: "Le programme Certified est pensé pour rendre les expertises plus lisibles grâce à des profils vérifiés, un périmètre de compétence explicite et des standards transparents." },
      reviews: { eyebrow: "Résultats", title: "Des preuves, pas des promesses.", copy: "Cet espace accueillera les retours vérifiés et études de cas dès leur publication.", empty: "Aucun témoignage fictif : les résultats seront documentés avec leur contexte, leur méthode et l’accord des personnes concernées." },
      pricing: { eyebrow: "Tarifs", title: "Une structure simple, encore en construction.", copy: "Les offres définitives seront publiées avant l’ouverture. Aucun prix n’est inventé à ce stade.", plans: [["Personal","Tarif à venir","Pour découvrir les fondations Zero Limit.",["Un espace métier", "Outils essentiels", "Ressources de démarrage"]],["Pro","Bientôt disponible","Pour structurer une activité en croissance.",["Expérience complète", "Zero Limit AI", "Conférences et rediffusions"]],["Team","Sur devis","Pour aligner une organisation esport.",["Espaces collaborateurs", "Pilotage partagé", "Accompagnement au déploiement"]]] },
      faq: { eyebrow: "FAQ", title: "Les réponses essentielles.", items: [["À qui s’adresse Zero Limit ?","Aux professionnels et organisations de l’esport qui veulent structurer leur activité : coachs, managers, dirigeants, community managers, creators et teams."],["Zero Limit AI agit-elle automatiquement ?","Non. Elle assiste l’analyse et la préparation ; vous gardez le contrôle et validez les actions importantes."],["Quand les tarifs seront-ils disponibles ?","Ils seront affichés clairement avant l’ouverture des offres. Les mentions actuelles sont volontairement explicites."],["Le produit sera-t-il disponible en anglais ?","La fondation est conçue pour le français et l’anglais. Le déploiement des locales accompagnera les futures phases produit."]] },
      final: { eyebrow: "Prêt pour la suite ?", title: "Donnez une structure à votre prochaine limite.", copy: "Choisissez l’espace qui vous ressemble et suivez la construction de la plateforme Zero Limit.", cta: "Découvrir mon espace" },
      footer: { copy: "L’écosystème premium qui structure les ambitions esport.", product: "Produit", company: "Agence", legal: "Informations", rights: "Zero Limit Agency. Tous droits réservés." }
    }
  },
  en: {
    common: {
      skipToContent: "Skip to content",
      loading: "Loading"
    },
    marketing: null
  }
};

dictionaries.en.marketing = dictionaries.fr.marketing;

export function getDictionary(locale = defaultLocale) {
  return dictionaries[resolveLocale(locale)];
}
