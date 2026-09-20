import Link from "next/link";
import { redirect } from "next/navigation";
import { PrivateShell } from "@/components/workspace/private-shell";
import { spaceDictionary } from "@/lib/i18n/spaces";
import { AuthenticationRequiredError } from "@/lib/zero-limit-id/profile";
import { getAccessibleSpacesForCurrentProfile } from "@/lib/zero-limit-id/spaces";

const copy = { personal: ["Personal", "Choisissez prochainement le métier qui structurera cet espace."], creator: ["Creator", "Préparez prochainement votre espace Creator."], team: ["Team", "La création et les invitations Team arrivent prochainement."] };

export default async function PreparationPage({ params }) {
  let context;
  try { context = await getAccessibleSpacesForCurrentProfile(); }
  catch (error) { if (error instanceof AuthenticationRequiredError) redirect("/identite/connexion"); throw error; }
  const content = copy[params.kind] || copy.personal;
  const labels = spaceDictionary(context.profile.preferred_locale);
  return <PrivateShell {...context} currentSpace={null} labels={labels}><section className="space-selector-page"><p className="space-kind">Préparation</p><h1>{content[0]}</h1><p>{content[1]}</p><p className="identity-hint">Aucun espace, abonnement ou accès n’a été créé.</p><Link className="button" href="/espace">Retour aux espaces</Link></section></PrivateShell>;
}
