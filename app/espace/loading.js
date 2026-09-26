export default function WorkspaceLoading() {
  return <main className="workspace-state" aria-busy="true" aria-live="polite">
    <p className="space-kind">Zero Limit</p>
    <div className="workspace-loading-line" aria-hidden="true" />
    <div className="workspace-loading-line short" aria-hidden="true" />
    <span>Chargement de votre espace…</span>
  </main>;
}
