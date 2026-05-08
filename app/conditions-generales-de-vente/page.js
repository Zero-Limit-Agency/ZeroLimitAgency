import { LegalPageTemplate } from "@/components/legal/legal-page-template";

export const metadata = {
  title: "Conditions générales de vente | Zero Limit Agency"
};

export default function ConditionsGeneralesVentePage() {
  return (
    <LegalPageTemplate
      eyebrow="Site"
      title="Conditions générales de vente (CGV)"
      placeholderTitle="Cadre commercial à compléter"
      placeholderBody="Ajoutez ici les modalités de commande, de paiement, d’exécution des prestations, de responsabilité, de résiliation et les clauses commerciales applicables."
    />
  );
}
