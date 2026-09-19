export const identityMessages = {
  fr: { welcome: "Bienvenue dans Zero Limit", logout: "Se déconnecter", locale: "Français" },
  en: { welcome: "Welcome to Zero Limit", logout: "Sign out", locale: "English" }
};

export function identityDictionary(locale) {
  return identityMessages[locale] || identityMessages.fr;
}
