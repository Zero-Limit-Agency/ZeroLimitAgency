import { LandingPage } from "@/components/landing-page";
import { MaintenanceScreen } from "@/components/maintenance-screen";
import { getUserRole } from "@/lib/auth/admin-access";
import { getAuthorizedClientAccess } from "@/lib/auth/client-access";
import { getClientSession } from "@/lib/auth/client-auth";
import { getMaintenanceModeState } from "@/lib/maintenance";
import { normalizeSiteContent } from "@/lib/site-content";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function buildInitialsFromName(firstName, lastName, email) {
  const first = String(firstName || "").trim().charAt(0);
  const last = String(lastName || "").trim().charAt(0);

  if (first || last) {
    return `${first}${last}`.toUpperCase();
  }

  return String(email || "ZL").trim().slice(0, 2).toUpperCase();
}

export default async function HomePage() {
  const session = await getClientSession();
  const adminClient = createSupabaseAdminClient();
  const siteContentResult = await adminClient.globalSiteSettings.get();
  const siteContent =
    siteContentResult.ok && Array.isArray(siteContentResult.data) && siteContentResult.data.length > 0
      ? normalizeSiteContent(siteContentResult.data[0]?.settings || {})
      : undefined;
  const maintenanceSettings = await getMaintenanceModeState(adminClient);

  if (!session?.user || session.isDemo) {
    if (maintenanceSettings.enabled) {
      return <MaintenanceScreen settings={maintenanceSettings} />;
    }

    return <LandingPage content={siteContent} />;
  }

  const role = await getUserRole(session.user);

  if (role === "admin") {
    return (
      <LandingPage
        content={siteContent}
        currentUser={{
          href: "/admin",
          initials: buildInitialsFromName(
            session.user?.user_metadata?.first_name,
            session.user?.user_metadata?.last_name,
            session.user?.email
          ),
          avatarUrl: "",
          ariaLabel: "Accéder à l'administration"
        }}
      />
    );
  }

  const access = await getAuthorizedClientAccess(session.user);

  if (!access?.application_id) {
    if (maintenanceSettings.enabled) {
      return <MaintenanceScreen settings={maintenanceSettings} />;
    }

    return <LandingPage content={siteContent} />;
  }

  if (maintenanceSettings.enabled) {
    return <MaintenanceScreen settings={maintenanceSettings} />;
  }

  const applicationResult = await adminClient.applications.getById(access.application_id);
  const profileResult = await adminClient.clientProfiles.getByApplicationId(access.application_id);

  const application =
    applicationResult.ok && Array.isArray(applicationResult.data) && applicationResult.data.length > 0
      ? applicationResult.data[0]
      : null;
  const profile =
    profileResult.ok && Array.isArray(profileResult.data) && profileResult.data.length > 0
      ? profileResult.data[0]
      : null;

  return (
    <LandingPage
      content={siteContent}
      currentUser={{
        href: "/espace-client",
        initials: buildInitialsFromName(application?.first_name, application?.last_name, session.user?.email),
        avatarUrl: profile?.avatar_data_url || "",
        ariaLabel: "Accéder à votre espace client"
      }}
    />
  );
}
