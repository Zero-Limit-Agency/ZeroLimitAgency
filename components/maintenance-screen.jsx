import Link from "next/link";

import { DEFAULT_MAINTENANCE_SETTINGS, normalizeMaintenanceSettings } from "@/lib/maintenance";

export function MaintenanceScreen({ settings = DEFAULT_MAINTENANCE_SETTINGS, adminAccessHref = "/connexion?admin_access=1" }) {
  const state = normalizeMaintenanceSettings(settings);

  return (
    <main className="maintenance-shell">
      <div className="maintenance-bg" aria-hidden="true" />

      <section className="maintenance-frame">
        <p className="eyebrow">Zero Limit Agency</p>
        <h1>{state.title}</h1>
        <p className="maintenance-lead">{state.message}</p>
        <p className="maintenance-note">{state.note}</p>
      </section>

      <div className="maintenance-admin-entry">
        <Link className="maintenance-admin-link" href={adminAccessHref}>
          Se connecter en tant qu'admin
        </Link>
      </div>
    </main>
  );
}
