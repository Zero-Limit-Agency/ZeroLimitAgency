import { LegalPageTemplate } from "@/components/legal/legal-page-template";

export const metadata = {
  title: "Conditions générales d'utilisation | Zero Limit Agency"
};

export default function ConditionsGeneralesUtilisationPage() {
  return (
    <LegalPageTemplate
      eyebrow="Site"
      title="Conditions générales d'utilisation (CGU)"
      placeholderTitle="Règles d’usage du site"
      placeholderBody="Ajoutez ici les conditions d’accès au site, les responsabilités, les usages autorisés, la propriété intellectuelle et les restrictions applicables aux utilisateurs."
    />
  );
}
