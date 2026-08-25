import { defaultLocale, resolveLocale } from "./config";

const dictionaries = {
  fr: {
    common: {
      skipToContent: "Aller au contenu",
      loading: "Chargement"
    }
  },
  en: {
    common: {
      skipToContent: "Skip to content",
      loading: "Loading"
    }
  }
};

export function getDictionary(locale = defaultLocale) {
  return dictionaries[resolveLocale(locale)];
}
