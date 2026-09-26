import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";
import { SpaceSwitcher } from "@/components/workspace/space-switcher";
import { WorkspaceNavigation } from "@/components/workspace/workspace-navigation";

export function PrivateShell({ children, profile, spaces, currentSpace, modules = [], labels }) {
  return <div className="private-shell">
    <header className="private-topbar">
      <Link className="private-brand" href="/espace" aria-label="Zero Limit — espaces"><span aria-hidden="true">ZL</span><strong>ZERO LIMIT</strong></Link>
      {spaces.length > 0
        ? <SpaceSwitcher spaces={spaces} currentSpace={currentSpace} labels={labels} />
        : <div className="space-switcher-empty" role="status">{labels.noActiveSpace}</div>}
      <nav className="private-profile" aria-label={labels.profile}>
        <Link href="/identite">{profile.display_name}</Link>
        <span title={labels.language}>{profile.preferred_locale?.toUpperCase() || "FR"}</span>
        <LogoutButton className="private-logout" label={labels.logout} />
      </nav>
    </header>
    {currentSpace && <div className="workspace-context-bar">
      <WorkspaceNavigation currentSpace={currentSpace} modules={modules} labels={labels} />
      <span className="workspace-context-status"><i aria-hidden="true" />{labels.ready}</span>
    </div>}
    <main className="private-content">{children}</main>
  </div>;
}
