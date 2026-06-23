import { redirect } from "next/navigation";

import { DropMapMaintenance } from "@/components/dropmap/dropmap-maintenance";
import { DropMapShell } from "@/components/dropmap/dropmap-shell";
import { getUserRole } from "@/lib/auth/admin-access";
import { getClientSession } from "@/lib/auth/client-auth";
import { getDropMapSettings } from "@/lib/dropmap/server/settings";
import { getDropMapVisibilityContext } from "@/lib/dropmap/server/visibility";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const metadata = {
  title: "Zero Limit Agency"
};

export default async function DropMapPage() {
  const adminClient = createSupabaseAdminClient();
  const settings = await getDropMapSettings(adminClient);
  const session = await getClientSession();
  const role = session?.user ? await getUserRole(session.user) : null;
  const visibility = getDropMapVisibilityContext({
    role,
    settings,
    isDemo: Boolean(session?.isDemo)
  });

  if (visibility.action === "redirect_home") {
    redirect("/");
  }

  if (visibility.action === "show_maintenance") {
    return <DropMapMaintenance message={settings.maintenanceMessage} />;
  }

  return <DropMapShell mode={visibility.mode} isAdminPreview={visibility.action === "show_admin_preview"} />;
}
