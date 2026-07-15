import { DropMapSettingsEditor } from "@/components/admin/dropmap/dropmap-settings-editor";
import { getDropMapSettings } from "@/lib/dropmap/server/settings";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const metadata = {
  title: "Administration DropMap | Zero Limit Agency"
};

export default async function AdminDropMapPage() {
  const settings = await getDropMapSettings(createSupabaseAdminClient());

  return <DropMapSettingsEditor initialSettings={settings} />;
}
