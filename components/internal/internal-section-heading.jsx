import styles from "@/components/internal/internal.module.css";

export function InternalSectionHeading({ eyebrow, title, description, action }) {
  return (
    <div className={styles.sectionHeading}>
      <div>
        {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {action || null}
    </div>
  );
}
