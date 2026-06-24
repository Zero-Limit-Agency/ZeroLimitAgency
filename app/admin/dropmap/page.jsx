import Link from "next/link";
import { redirect } from "next/navigation";

import { DropMapSettingsEditor } from "@/components/admin/dropmap/dropmap-settings-editor";
import { LogoutButton } from "@/components/auth/logout-button";
import { InternalHeader } from "@/components/internal/internal-header";
import { InternalPageShell } from "@/components/internal/internal-page-shell";
import { InternalStatusBadge } from "@/components/internal/internal-status-badge";
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
    <InternalPageShell legacyClassName="admin-shell" contentClassName="admin-frame">
      <InternalHeader
        eyebrow="Administration"
        title="DropMap"
        description="Pilotez la visibilité confidentielle de /dropmap sans exposer la fonctionnalité publiquement avant décision officielle."
        badge={<InternalStatusBadge variant={settings.visibilityMode}>{`Mode ${settings.visibilityMode}`}</InternalStatusBadge>}
        actions={
          <>
            <Link className="button button-dark" href="/admin">
              Retour à l'administration
            </Link>
            <LogoutButton label="Se déconnecter" />
          </>
        }
        compact
      />

      <div className="admin-sections">
        <DropMapSettingsEditor initialSettings={settings} />
      </div>
    </InternalPageShell>
  );
}
