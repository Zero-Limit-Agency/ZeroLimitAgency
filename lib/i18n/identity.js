export const identityMessages = {
  fr: { accountTitle: "Mon compte", workspaceHint: "Retrouvez vos Spaces ou consultez les options d’activation dans votre Workspace. Pour rejoindre une Team, ouvrez le lien de votre invitation.", openWorkspace: "Accéder au Workspace", manageSpaces: "Choisir ou activer un Space", legacyWorkspace: "Mon espace client", welcome: "Bienvenue dans Zero Limit", logout: "Se déconnecter", locale: "Français" },
  en: { accountTitle: "My account", workspaceHint: "Find your Spaces or view activation options in your Workspace. To join a Team, open your invitation link.", openWorkspace: "Open Workspace", manageSpaces: "Choose or activate a Space", legacyWorkspace: "My client workspace", welcome: "Welcome to Zero Limit", logout: "Sign out", locale: "English" }
};

export function identityDictionary(locale) {
  return identityMessages[locale] || identityMessages.fr;
}
