import { DEFAULT_MAINTENANCE_SETTINGS, normalizeMaintenanceSettings } from "@/lib/maintenance";
import { Badge, Button } from "@/components/marketing/ui";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { PublicFooter } from "@/components/marketing/public-chrome";
import "@/components/marketing/marketing.css";

export function MaintenanceScreen({ settings = DEFAULT_MAINTENANCE_SETTINGS, adminAccessHref = "/connexion?admin_access=1" }) {
  const state = normalizeMaintenanceSettings(settings);

  return (
    <MarketingShell className="status-page"><a className="zl-skip" href="#main">Aller au contenu</a><main className="maintenance-shell" id="main">
      <div className="maintenance-bg" aria-hidden="true" />

      <section className="maintenance-frame">
        <a className="zl-brand maintenance-brand" href="/" aria-label="Zero Limit Agency — accueil"><img src="/assets/zero-limit-logo.png" alt="" /><span>ZERO LIMIT<small>AGENCY</small></span></a>
        <Badge>Maintenance</Badge>
        <h1>{state.title}</h1>
        <p className="maintenance-lead">{state.message}</p>
        <p className="maintenance-note">{state.note}</p>
        <Button href="mailto:contact@zerolimit.agency" variant="secondary">Nous contacter</Button>
        <div className="maintenance-admin-entry">
          <Button className="maintenance-admin-link" variant="ghost" size="sm" href={adminAccessHref}>Accès administrateur</Button>
        </div>
      </section>
    </main><PublicFooter minimal /></MarketingShell>
  );
}
