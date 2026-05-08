import { LegalPageTemplate } from "@/components/legal/legal-page-template";

export const metadata = {
  title: "Politique de confidentialité | Zero Limit Agency"
};

export default function PolitiqueConfidentialitePage() {
  return (
    <LegalPageTemplate
      eyebrow="Site"
      title="Politique de confidentialité"
      placeholderTitle="Traitement des données personnelles"
      placeholderBody="Ajoutez ici le détail des données collectées, les finalités, les bases légales, la durée de conservation, les droits des utilisateurs et les modalités de contact."
    />
  );
}
