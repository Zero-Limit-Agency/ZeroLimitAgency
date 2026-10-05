import { PageHeader } from "@/components/workspace/page-header";

/** Minimal host shared by future, independently-authorized business modules. */
export function ModuleShell({ icon, eyebrow, title, description, status, actions, subnav, children }) {
  return <section className="workspace-module-shell">
    <div className="workspace-module-heading">
      {icon && <span className={`workspace-module-icon icon-${icon}`} aria-hidden="true" />}
      <PageHeader eyebrow={eyebrow} title={title} description={description} status={status} actions={actions} />
    </div>
    {subnav && <nav className="workspace-module-subnav" aria-label={`${title} — navigation`}>{subnav}</nav>}
    <div className="workspace-module-content">{children}</div>
  </section>;
}
