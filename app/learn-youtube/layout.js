import { redirect } from "next/navigation";

import { LearnYoutubeMaintenance, LearnYoutubeShell } from "@/components/learn-youtube/learn-youtube-shell";
import { getUserRole } from "@/lib/auth/admin-access";
import { getClientSession } from "@/lib/auth/client-auth";
import { getYoutubeTrainingSettings } from "@/lib/learn-youtube/settings";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const metadata = {
  title: "Formation YouTube | Zero Limit Agency",
  description: "Fondation temporaire de la Formation YouTube Zero Limit Agency."
};

export default async function LearnYoutubeLayout({ children }) {
  const adminClient = createSupabaseAdminClient();
  const settings = await getYoutubeTrainingSettings(adminClient);
  const session = await getClientSession();
  const role = session?.user ? await getUserRole(session.user) : null;
  const isAdmin = role === "admin";

  if (settings.mode === "private" && !isAdmin) {
    redirect("/");
  }

  if (settings.mode === "maintenance" && !isAdmin) {
    return <LearnYoutubeMaintenance message={settings.maintenance_message} />;
  }

  return (
    <LearnYoutubeShell settings={settings} isAdmin={isAdmin}>
      {children}
    </LearnYoutubeShell>
  );
}
