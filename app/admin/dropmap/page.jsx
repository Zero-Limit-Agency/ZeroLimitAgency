import Link from "next/link";
import { redirect } from "next/navigation";

import { DropMapSettingsEditor } from "@/components/admin/dropmap/dropmap-settings-editor";
import { LogoutButton } from "@/components/auth/logout-button";
import { getUserRole, isAdminUser } from "@/lib/auth/admin-access";
import { getClientSession } from "@/lib/auth/client-auth";
import { getDropMapSettings } from "@/lib/dropmap/server/settings";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const metadata = {
  title: "Administration DropMap | Zero Limit Agency"
};

export default async function AdminDropMapPage() {
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

  const settings = await getDropMapSettings(createSupabaseAdminClient());

  return (
    <main className="admin-shell">
      <section className="admin-frame">
        <header className="admin-header admin-header-compact">
          <div>
            <p className="eyebrow">Administration</p>
            <h1>DropMap</h1>
            <p className="admin-lead">
              Pilotez la visibilité confidentielle de /dropmap sans exposer la fonctionnalité publiquement avant décision officielle.
            </p>
          </div>

          <div className="admin-header-actions">
            <Link className="button button-dark" href="/admin">
              Retour à l'administration
            </Link>
            <LogoutButton label="Se déconnecter" />
          </div>
        </header>

        <div className="admin-sections">
          <DropMapSettingsEditor initialSettings={settings} />
        </div>
      </section>
    </main>
  );
}
