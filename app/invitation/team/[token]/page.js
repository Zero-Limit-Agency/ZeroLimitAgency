import Link from "next/link";
import { getClientSession } from "@/lib/auth/client-auth";
import { InvitationAcceptance } from "@/components/workspace/invitation-acceptance";
import { spaceDictionary } from "@/lib/i18n/spaces";

export const dynamic = "force-dynamic";
export default async function TeamInvitationPage({ params }) {
  const labels = spaceDictionary("fr");
  const session = await getClientSession();
  const returnTo = `/invitation/team/${encodeURIComponent(params.token)}`;
  return <main className="identity-shell"><section className="identity-card"><p className="space-kind">Zero Limit Team</p><h1>{labels.teamInvitation}</h1><p>{labels.teamInvitationText}</p>{session?.user && !session.isDemo ? <InvitationAcceptance token={params.token} labels={labels} /> : <div className="space-empty-actions"><Link href={`/connexion?next=${encodeURIComponent(returnTo)}`}>{labels.signInToAccept}</Link><Link href={`/inscription?next=${encodeURIComponent(returnTo)}`}>{labels.signUpToAccept}</Link></div>}</section></main>;
}
