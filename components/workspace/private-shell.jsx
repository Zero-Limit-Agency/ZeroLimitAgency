import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";
import { SpaceSwitcher } from "@/components/workspace/space-switcher";

export function PrivateShell({ children, profile, spaces, currentSpace, labels }) {
  return <div className="private-shell">
    <header className="private-topbar">
      <Link className="private-brand" href="/espace" aria-label="Zero Limit — espaces">ZERO LIMIT</Link>
      {spaces.length > 0
        ? <SpaceSwitcher spaces={spaces} currentSpace={currentSpace} labels={labels} />
        : <div className="space-switcher-empty" role="status">{labels.noActiveSpace}</div>}
      <nav className="private-profile" aria-label={labels.profile}>
        <Link href="/identite">{profile.display_name}</Link>
        <span title={labels.language}>{profile.preferred_locale?.toUpperCase() || "FR"}</span>
        <LogoutButton className="private-logout" label={labels.logout} />
      </nav>
    </header>
    <main className="private-content">{children}</main>
  </div>;
}
