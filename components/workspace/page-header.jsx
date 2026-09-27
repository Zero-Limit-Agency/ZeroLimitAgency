export function PageHeader({ eyebrow, title, description, status, actions, titleId }) {
  return <header className="workspace-page-header">
    <div className="workspace-page-heading">
      {eyebrow && <p className="space-kind">{eyebrow}</p>}
      <div className="workspace-title-line">
        <h1 id={titleId}>{title}</h1>
        {status}
      </div>
      {description && <p className="workspace-page-description">{description}</p>}
    </div>
    {actions && <div className="workspace-page-actions">{actions}</div>}
  </header>;
}

export function StatusBadge({ tone = "neutral", children }) {
  return <span className={`workspace-badge workspace-badge-${tone}`}>{children}</span>;
}
