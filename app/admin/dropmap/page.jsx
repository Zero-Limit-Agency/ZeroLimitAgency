import Link from "next/link";
import { redirect } from "next/navigation";

import { DropMapSettingsEditor } from "@/components/admin/dropmap/dropmap-settings-editor";
import { LogoutButton } from "@/components/auth/logout-button";
import styles from "@/components/admin/dropmap/dropmap-admin.module.css";
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
    <main className={styles.shell}>
      <section className={styles.frame}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Administration</p>
            <h1>DropMap</h1>
            <p className={styles.lead}>
              Pilotez la visibilité confidentielle de /dropmap sans exposer la fonctionnalité publiquement avant décision officielle.
            </p>
          </div>

          <div className={styles.headerActions}>
            <Link className={styles.button} href="/admin">
              Retour à l'administration
            </Link>
            <LogoutButton label="Se déconnecter" />
          </div>
        </header>

        <div className={styles.sections}>
          <DropMapSettingsEditor initialSettings={settings} />
        </div>
      </section>
    </main>
  );
}
