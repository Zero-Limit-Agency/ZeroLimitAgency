import styles from "@/components/internal/internal.module.css";

export function InternalEmptyState({ title, description, action }) {
  return (
    <article className={styles.emptyState}>
      <strong>{title}</strong>
      {description ? <p>{description}</p> : null}
      {action || null}
    </article>
  );
}
