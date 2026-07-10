import Link from "next/link";
import { redirect } from "next/navigation";

import { TrainingAdminManager } from "@/components/admin/training/training-admin-manager";
import { LogoutButton } from "@/components/auth/logout-button";
import { getUserRole, isAdminUser } from "@/lib/auth/admin-access";
import { getClientSession } from "@/lib/auth/client-auth";
import { loadTrainingAdminModel, listAuthUsersForAdmin } from "@/lib/learn-youtube/admin-catalog";

export const dynamic = "force-dynamic";
export const metadata = { title: "Administration formations | Zero Limit Agency" };

export default async function AdminFormationsPage() {
  const session = await getClientSession();

  if (!session?.user) {
    redirect("/connexion");
  }

  const role = await getUserRole(session.user);

  if (!(await isAdminUser(session.user))) {
    if (role === "client") {
      redirect("/espace-client");
    }
    redirect("/connexion");
  }

  const [model, users] = await Promise.all([
    loadTrainingAdminModel(),
    listAuthUsersForAdmin({ page: 1, perPage: 100 })
  ]);

  return (
    <main className="admin-shell">
      <section className="admin-frame">
        <header className="admin-header">
          <div>
            <p className="eyebrow">Administration</p>
            <h1>Catalogue Formation YouTube</h1>
            <p className="admin-lead">
              Gérez le programme, les packs, modules, leçons, ressources et accès manuels depuis l'administration existante.
            </p>
          </div>
          <div className="admin-header-actions">
            <Link className="button button-dark" href="/admin">Retour admin</Link>
            <Link className="button button-dark" href="/learn-youtube/espace">Preview espace</Link>
            <LogoutButton label="Se déconnecter" />
          </div>
        </header>

        <TrainingAdminManager initialModel={{ ...model, users }} />
      </section>
    </main>
  );
}
