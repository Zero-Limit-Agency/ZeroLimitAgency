const dictionaries = {
  fr: {
    groups: { personal: "Personal", creator: "Creator", team: "Teams" },
    professions: { coach: "Coach", manager_agent: "Manager / Agent", ceo: "CEO / Dirigeant", community_manager: "Community Manager" },
    roles: { admin: "Admin", member: "Membre" },
    switchSpace: "Changer d’espace", chooseSpace: "Choisir un espace", noSpaces: "Aucun espace disponible", noActiveSpace: "Aucun espace actif", createOrJoinSpace: "Créer ou rejoindre un espace",
    ready: "Espace prêt", profile: "Profil", language: "Langue", logout: "Se déconnecter",
    emptyTitle: "Votre Zero Limit ID est prêt.", emptyText: "Choisissez la prochaine étape. Rien ne sera créé sans votre confirmation.", activeSpaces: "Vos espaces actifs", addSpace: "Créer ou rejoindre un espace",
    discoverPersonal: "Découvrir Personal", discoverCreator: "Découvrir Creator", discoverTeam: "Créer ou rejoindre une Team",
    personalModules: "Les modules métier seront bientôt disponibles.", creatorModules: "Les modules Creator sont en préparation.", teamModules: "Les modules Team sont en préparation.",
    owner: "Propriétaire", organization: "Organisation", role: "Rôle", unavailable: "Cet espace n’est pas disponible.", back: "Retour aux espaces"
    ,preparation: "Préparation", provisionTitles: { personal: "Choisissez votre espace Personal", creator: "Activez votre espace Creator", team: "Créez ou rejoignez une Team" },
    provisionDescriptions: { personal: "Une profession structure chaque espace Personal.", creator: "Préparez le contexte Creator, sans portfolio ni paiement.", team: "Créez une organisation et son espace Team principal." },
    chooseProfession: "Profession", alreadyActive: "Déjà actif", organizationName: "Nom de l’organisation", slug: "Slug", review: "Vérifier avant de créer", confirmation: "Confirmer le provisioning", noPayment: "Aucun paiement n’est effectué pendant cette phase.", createSpace: "Créer cet espace", activateCreator: "Activer mon espace Creator", modify: "Modifier", processing: "Traitement en cours…", genericError: "Une erreur est survenue.", createTeam: "Créer une Team", joinByInvitation: "Pour rejoindre une Team, utilisez exclusivement le lien sécurisé reçu par email.", inviteMember: "Inviter un membre", email: "Email", sendInvitation: "Envoyer l’invitation", invitationSent: "Invitation envoyée.", invitationCreated: "Invitation créée. L’envoi email n’est pas configuré ; utilisez le lien Preview ci-dessous.", previewInvitation: "Ouvrir l’invitation Preview", teamInvitation: "Invitation à rejoindre une Team", teamInvitationText: "Le lien sera vérifié au moment de l’acceptation. Le compte connecté doit utiliser l’email invité.", signInToAccept: "Se connecter pour accepter", signUpToAccept: "Créer un compte", acceptInvitation: "Accepter l’invitation", invitationAccepted: "Invitation acceptée."
  },
  en: {
    groups: { personal: "Personal", creator: "Creator", team: "Teams" },
    professions: { coach: "Coach", manager_agent: "Manager / Agent", ceo: "CEO / Executive", community_manager: "Community Manager" },
    roles: { admin: "Admin", member: "Member" },
    switchSpace: "Switch space", chooseSpace: "Choose a space", noSpaces: "No space available", noActiveSpace: "No active space", createOrJoinSpace: "Create or join a space",
    ready: "Space ready", profile: "Profile", language: "Language", logout: "Log out",
    emptyTitle: "Your Zero Limit ID is ready.", emptyText: "Choose what comes next. Nothing will be created without your confirmation.", activeSpaces: "Your active spaces", addSpace: "Create or join a space",
    discoverPersonal: "Discover Personal", discoverCreator: "Discover Creator", discoverTeam: "Create or join a Team",
    personalModules: "Professional modules are coming soon.", creatorModules: "Creator modules are in preparation.", teamModules: "Team modules are in preparation.",
    owner: "Owner", organization: "Organization", role: "Role", unavailable: "This space is unavailable.", back: "Back to spaces"
    ,preparation: "Setup", provisionTitles: { personal: "Choose your Personal space", creator: "Activate your Creator space", team: "Create or join a Team" },
    provisionDescriptions: { personal: "One profession structures each Personal space.", creator: "Prepare the Creator context without portfolio or payment.", team: "Create an organization and its primary Team space." },
    chooseProfession: "Profession", alreadyActive: "Already active", organizationName: "Organization name", slug: "Slug", review: "Review before creating", confirmation: "Confirm provisioning", noPayment: "No payment is made during this phase.", createSpace: "Create this space", activateCreator: "Activate my Creator space", modify: "Edit", processing: "Processing…", genericError: "Something went wrong.", createTeam: "Create a Team", joinByInvitation: "To join a Team, only use the secure link received by email.", inviteMember: "Invite a member", email: "Email", sendInvitation: "Send invitation", invitationSent: "Invitation sent.", invitationCreated: "Invitation created. Email is not configured; use the Preview link below.", previewInvitation: "Open Preview invitation", teamInvitation: "Invitation to join a Team", teamInvitationText: "The link is checked upon acceptance. The signed-in account must use the invited email.", signInToAccept: "Sign in to accept", signUpToAccept: "Create an account", acceptInvitation: "Accept invitation", invitationAccepted: "Invitation accepted."
  }
};

export function spaceDictionary(locale) {
  return dictionaries[locale] || dictionaries.fr;
}
