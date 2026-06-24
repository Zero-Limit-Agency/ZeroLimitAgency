import styles from "@/components/internal/internal.module.css";

export function InternalHeader({
  eyebrow,
  title,
  description,
  actions,
  badge,
  compact = false,
  className = ""
}) {
  const headerClassName = [styles.header, compact ? styles.headerCompact : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <header className={headerClassName}>
      <div>
        {badge ? <div>{badge}</div> : null}
        {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
        <h1 className={styles.title}>{title}</h1>
        {description ? <p className={styles.description}>{description}</p> : null}
      </div>
      {actions ? <div className={styles.headerActions}>{actions}</div> : null}
    </header>
  );
}
