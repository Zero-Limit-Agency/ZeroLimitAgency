import { LegalPageTemplate } from "@/components/legal/legal-page-template";

export const metadata = {
  title: "Politique de remboursement | Zero Limit Agency"
};

export default function PolitiqueRemboursementPage() {
  return (
    <LegalPageTemplate
      eyebrow="Site"
      title="Politique de remboursement"
      placeholderTitle="Modalités de remboursement"
      placeholderBody="Ajoutez ici les conditions d’éligibilité, les délais, les exclusions, les étapes de demande et le traitement des remboursements éventuels."
    />
  );
}
