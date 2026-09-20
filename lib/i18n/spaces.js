const dictionaries = {
  fr: {
    locale: "fr-FR",
    groups: { personal: "Personal", creator: "Creator", team: "Teams" },
    professions: { coach: "Coach", manager_agent: "Manager / Agent", ceo: "CEO / Dirigeant", community_manager: "Community Manager" },
    roles: { admin: "Admin", member: "Membre" },
    switchSpace: "Changer d’espace", chooseSpace: "Choisir un espace", noSpaces: "Aucun espace disponible", noActiveSpace: "Aucun espace actif", createOrJoinSpace: "Créer ou rejoindre un espace",
    ready: "Espace prêt", profile: "Profil", language: "Langue", logout: "Se déconnecter",
    emptyTitle: "Votre Zero Limit ID est prêt.", emptyText: "Choisissez la prochaine étape. Rien ne sera créé sans votre confirmation.", activeSpaces: "Vos espaces actifs", addSpace: "Créer ou rejoindre un espace",
    discoverPersonal: "Découvrir Personal", discoverCreator: "Découvrir Creator", discoverTeam: "Créer ou rejoindre une Team",
    personalModules: "Les modules métier seront bientôt disponibles.", creatorModules: "Les modules Creator sont en préparation.", teamModules: "Les modules Team sont en préparation.",
    owner: "Propriétaire", organization: "Organisation", role: "Rôle", unavailable: "Cet espace n’est pas disponible.", back: "Retour aux espaces"
    ,teamManagement: {
      manageMembers: "Gérer les membres", members: "Membres", visibility: "Tous les membres de cette Team peuvent consulter cette liste.", backToTeam: "Retour à la Team",
      admins: "Admins", membersGroup: "Membres", joined: "Arrivée :", you: "Vous", actionsFor: "Actions pour", promote: "Promouvoir admin", demote: "Rétrograder membre", remove: "Retirer",
      pendingInvitations: "Invitations en attente", expires: "Expire :", resend: "Renvoyer", revoke: "Révoquer", leave: "Quitter la Team", leaveHint: "Votre accès à cette Team sera immédiatement retiré.", ownerCannotLeave: "Le propriétaire ne peut pas quitter la Team. Un transfert de propriété sera nécessaire dans une phase future.",
      confirmRemove: "Retirer {name} de la Team ? Son accès sera immédiatement supprimé.", confirmRevoke: "Révoquer l’invitation envoyée à {email} ?", confirmLeave: "Quitter cette Team ? Vous perdrez immédiatement votre accès.",
      promoted: "Le membre est maintenant admin.", demoted: "L’admin est maintenant membre.", removed: "Le membre a été retiré.", resent: "Un nouveau lien d’invitation a été généré et l’ancien est invalide.", revoked: "L’invitation a été révoquée.", left: "Vous avez quitté la Team.",
      empty: { owner: "Aucun propriétaire visible.", admin: "Aucun autre admin.", member: "Aucun membre simple." }, emptyInvitations: "Aucune invitation en attente.",
      errors: { target_not_member: "Ce membre ne fait plus partie de la Team.", owner_protected: "Le propriétaire canonique est protégé.", insufficient_permission: "Vous n’avez pas la permission d’effectuer cette action.", invitation_already_used: "Cette invitation a déjà été utilisée.", invitation_revoked: "Cette invitation est révoquée.", invitation_expired: "Cette invitation a expiré.", already_removed: "Votre accès a déjà été retiré.", cannot_leave_as_owner: "Le propriétaire doit d’abord transférer la propriété.", use_leave_team: "Utilisez l’action Quitter la Team.", unexpected_error: "Une erreur inattendue est survenue." }
    },
    preparation: "Préparation", provisionTitles: { personal: "Choisissez votre espace Personal", creator: "Activez votre espace Creator", team: "Créez ou rejoignez une Team" },
    provisionDescriptions: { personal: "Une profession structure chaque espace Personal.", creator: "Préparez le contexte Creator, sans portfolio ni paiement.", team: "Créez une organisation et son espace Team principal." },
    chooseProfession: "Profession", alreadyActive: "Déjà actif", organizationName: "Nom de l’organisation", slug: "Slug", review: "Vérifier avant de créer", confirmation: "Confirmer le provisioning", noPayment: "Aucun paiement n’est effectué pendant cette phase.", createSpace: "Créer cet espace", activateCreator: "Activer mon espace Creator", modify: "Modifier", processing: "Traitement en cours…", genericError: "Une erreur est survenue.", createTeam: "Créer une Team", joinByInvitation: "Pour rejoindre une Team, utilisez exclusivement le lien sécurisé reçu par email.", inviteMember: "Inviter un membre", email: "Email", sendInvitation: "Envoyer l’invitation", invitationSent: "Invitation envoyée.", invitationCreated: "Invitation créée. L’envoi email n’est pas configuré ; utilisez le lien Preview ci-dessous.", previewInvitation: "Ouvrir l’invitation Preview", teamInvitation: "Invitation à rejoindre une Team", teamInvitationText: "Le lien sera vérifié au moment de l’acceptation. Le compte connecté doit utiliser l’email invité.", signInToAccept: "Se connecter pour accepter", signUpToAccept: "Créer un compte", acceptInvitation: "Accepter l’invitation", invitationAccepted: "Invitation acceptée."
  },
  en: {
    locale: "en-GB",
    groups: { personal: "Personal", creator: "Creator", team: "Teams" },
    professions: { coach: "Coach", manager_agent: "Manager / Agent", ceo: "CEO / Executive", community_manager: "Community Manager" },
    roles: { admin: "Admin", member: "Member" },
    switchSpace: "Switch space", chooseSpace: "Choose a space", noSpaces: "No space available", noActiveSpace: "No active space", createOrJoinSpace: "Create or join a space",
    ready: "Space ready", profile: "Profile", language: "Language", logout: "Log out",
    emptyTitle: "Your Zero Limit ID is ready.", emptyText: "Choose what comes next. Nothing will be created without your confirmation.", activeSpaces: "Your active spaces", addSpace: "Create or join a space",
    discoverPersonal: "Discover Personal", discoverCreator: "Discover Creator", discoverTeam: "Create or join a Team",
    personalModules: "Professional modules are coming soon.", creatorModules: "Creator modules are in preparation.", teamModules: "Team modules are in preparation.",
    owner: "Owner", organization: "Organization", role: "Role", unavailable: "This space is unavailable.", back: "Back to spaces"
    ,teamManagement: {
      manageMembers: "Manage members", members: "Members", visibility: "Every member of this Team can view this list.", backToTeam: "Back to Team",
      admins: "Admins", membersGroup: "Members", joined: "Joined:", you: "You", actionsFor: "Actions for", promote: "Promote to admin", demote: "Demote to member", remove: "Remove",
      pendingInvitations: "Pending invitations", expires: "Expires:", resend: "Resend", revoke: "Revoke", leave: "Leave Team", leaveHint: "Your access to this Team will be removed immediately.", ownerCannotLeave: "The owner cannot leave the Team. Ownership transfer will be required in a future phase.",
      confirmRemove: "Remove {name} from the Team? Their access will be removed immediately.", confirmRevoke: "Revoke the invitation sent to {email}?", confirmLeave: "Leave this Team? You will immediately lose access.",
      promoted: "The member is now an admin.", demoted: "The admin is now a member.", removed: "The member was removed.", resent: "A new invitation link was generated and the old one is invalid.", revoked: "The invitation was revoked.", left: "You left the Team.",
      empty: { owner: "No owner is visible.", admin: "No other admin.", member: "No standard member." }, emptyInvitations: "No pending invitation.",
      errors: { target_not_member: "This person is no longer a Team member.", owner_protected: "The canonical owner is protected.", insufficient_permission: "You do not have permission to perform this action.", invitation_already_used: "This invitation has already been used.", invitation_revoked: "This invitation is revoked.", invitation_expired: "This invitation has expired.", already_removed: "Your access has already been removed.", cannot_leave_as_owner: "The owner must transfer ownership first.", use_leave_team: "Use the Leave Team action.", unexpected_error: "An unexpected error occurred." }
    },
    preparation: "Setup", provisionTitles: { personal: "Choose your Personal space", creator: "Activate your Creator space", team: "Create or join a Team" },
    provisionDescriptions: { personal: "One profession structures each Personal space.", creator: "Prepare the Creator context without portfolio or payment.", team: "Create an organization and its primary Team space." },
    chooseProfession: "Profession", alreadyActive: "Already active", organizationName: "Organization name", slug: "Slug", review: "Review before creating", confirmation: "Confirm provisioning", noPayment: "No payment is made during this phase.", createSpace: "Create this space", activateCreator: "Activate my Creator space", modify: "Edit", processing: "Processing…", genericError: "Something went wrong.", createTeam: "Create a Team", joinByInvitation: "To join a Team, only use the secure link received by email.", inviteMember: "Invite a member", email: "Email", sendInvitation: "Send invitation", invitationSent: "Invitation sent.", invitationCreated: "Invitation created. Email is not configured; use the Preview link below.", previewInvitation: "Open Preview invitation", teamInvitation: "Invitation to join a Team", teamInvitationText: "The link is checked upon acceptance. The signed-in account must use the invited email.", signInToAccept: "Sign in to accept", signUpToAccept: "Create an account", acceptInvitation: "Accept invitation", invitationAccepted: "Invitation accepted."
  }
};

export function spaceDictionary(locale) {
  return dictionaries[locale] || dictionaries.fr;
}
