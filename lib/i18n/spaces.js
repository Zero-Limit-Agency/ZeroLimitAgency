const dictionaries = {
  fr: {
    groups: { personal: "Personal", creator: "Creator", team: "Teams" },
    professions: { coach: "Coach", manager_agent: "Manager / Agent", ceo: "CEO / Dirigeant", community_manager: "Community Manager" },
    roles: { admin: "Admin", member: "Membre" },
    switchSpace: "Changer d’espace", chooseSpace: "Choisir un espace", noSpaces: "Aucun espace disponible", noActiveSpace: "Aucun espace actif",
    ready: "Espace prêt", profile: "Profil", language: "Langue", logout: "Se déconnecter",
    emptyTitle: "Votre Zero Limit ID est prêt.", emptyText: "Choisissez la prochaine étape. Rien ne sera créé sans votre confirmation.",
    discoverPersonal: "Découvrir Personal", discoverCreator: "Découvrir Creator", discoverTeam: "Créer ou rejoindre une Team",
    personalModules: "Les modules métier seront bientôt disponibles.", creatorModules: "Les modules Creator sont en préparation.", teamModules: "Les modules Team sont en préparation.",
    owner: "Propriétaire", organization: "Organisation", role: "Rôle", unavailable: "Cet espace n’est pas disponible.", back: "Retour aux espaces"
  },
  en: {
    groups: { personal: "Personal", creator: "Creator", team: "Teams" },
    professions: { coach: "Coach", manager_agent: "Manager / Agent", ceo: "CEO / Executive", community_manager: "Community Manager" },
    roles: { admin: "Admin", member: "Member" },
    switchSpace: "Switch space", chooseSpace: "Choose a space", noSpaces: "No space available", noActiveSpace: "No active space",
    ready: "Space ready", profile: "Profile", language: "Language", logout: "Log out",
    emptyTitle: "Your Zero Limit ID is ready.", emptyText: "Choose what comes next. Nothing will be created without your confirmation.",
    discoverPersonal: "Discover Personal", discoverCreator: "Discover Creator", discoverTeam: "Create or join a Team",
    personalModules: "Professional modules are coming soon.", creatorModules: "Creator modules are in preparation.", teamModules: "Team modules are in preparation.",
    owner: "Owner", organization: "Organization", role: "Role", unavailable: "This space is unavailable.", back: "Back to spaces"
  }
};

export function spaceDictionary(locale) {
  return dictionaries[locale] || dictionaries.fr;
}
