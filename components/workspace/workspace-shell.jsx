export function WorkspaceShell({ children }) {
  return <div className="workspace-root" data-surface="workspace">
    <div className="workspace-ambient" aria-hidden="true" />
    {children}
  </div>;
}
