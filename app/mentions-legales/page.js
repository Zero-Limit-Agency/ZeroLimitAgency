import { LegalPageTemplate } from "@/components/legal/legal-page-template";

export const metadata = {
  title: "Mentions légales | Zero Limit Agency"
};

export default function MentionsLegalesPage() {
  return (
    <LegalPageTemplate
      eyebrow="Site"
      title="Mentions légales"
      placeholderTitle="Informations légales à compléter"
      placeholderBody="Ajoutez ici l’identité de l’éditeur du site, les coordonnées, l’hébergeur, les contacts utiles et toute autre mention réglementaire obligatoire."
    />
  );
}
