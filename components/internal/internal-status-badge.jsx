import styles from "@/components/internal/internal.module.css";

const VARIANT_CLASS = {
  admin: styles.badgeAdmin,
  client: styles.badge,
  demo: styles.badgeDemo,
  private: styles.badgePrivate,
  maintenance: styles.badgeMaintenance,
  public: styles.badge,
  danger: styles.badgeDanger,
  neutral: styles.badge
};

export function InternalStatusBadge({ children, variant = "neutral", className = "" }) {
  return <span className={[styles.badge, VARIANT_CLASS[variant], className].filter(Boolean).join(" ")}>{children}</span>;
}
