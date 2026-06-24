import styles from "@/components/internal/internal.module.css";

export function InternalPageShell({
  children,
  variant = "default",
  framed = true,
  legacyClassName = "",
  contentClassName = "",
  contentId = "main-content"
}) {
  const shellClassName = [
    styles.shell,
    framed ? styles.framed : "",
    styles[variant] || "",
    legacyClassName
  ]
    .filter(Boolean)
    .join(" ");

  const frameClassName = [styles.frame, contentClassName].filter(Boolean).join(" ");

  return (
    <main className={shellClassName}>
      <a className={styles.skipLink} href={`#${contentId}`}>
        Aller au contenu
      </a>
      <div id={contentId} className={frameClassName}>
        {children}
      </div>
    </main>
  );
}
