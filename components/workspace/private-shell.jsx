import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";
import { SpaceSwitcher } from "@/components/workspace/space-switcher";
import { WorkspaceNavigation } from "@/components/workspace/workspace-navigation";

function AccountArea({ profile, labels, compact = false }) {
  const initial = (profile.display_name || "Z").trim().charAt(0).toUpperCase();
  return <nav className={`workspace-account${compact ? " is-compact" : ""}`} aria-label={labels.account || labels.profile}>
    <Link className="workspace-account-profile" href="/identite">
      <span className="workspace-account-avatar" aria-hidden="true">{initial}</span>
      <span className="workspace-account-copy"><strong>{profile.display_name}</strong><small>{labels.profile}</small></span>
    </Link>
    <span className="workspace-locale" title={labels.language}>{profile.preferred_locale?.toUpperCase() || "FR"}</span>
    <LogoutButton className="private-logout" label={labels.logout} />
  </nav>;
}

export function PrivateShell({ children, profile, spaces, currentSpace, modules = [], labels }) {
  return <div className={`private-shell${currentSpace ? " has-space" : ""}`}>
    <header className="private-topbar">
      <Link className="private-brand" href="/espace" aria-label="Zero Limit — espaces"><span aria-hidden="true">ZL</span><strong>ZERO LIMIT</strong></Link>
      {spaces.length > 0
        ? <SpaceSwitcher spaces={spaces} currentSpace={currentSpace} labels={labels} />
        : <div className="space-switcher-empty" role="status">{labels.noActiveSpace}</div>}
      {!currentSpace && <AccountArea profile={profile} labels={labels} compact />}
    </header>
    {currentSpace
      ? <div className="workspace-product-layout">
          <WorkspaceNavigation currentSpace={currentSpace} modules={modules} labels={labels} account={<AccountArea profile={profile} labels={labels} />} />
          <main className="private-content" id="workspace-content">{children}</main>
        </div>
      : <main className="private-content">{children}</main>}
  </div>;
}
