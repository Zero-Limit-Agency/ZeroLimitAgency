import styles from "./dropmap.module.css";

const MODE_LABELS = {
  private: "Mode privé",
  maintenance: "Mode maintenance",
  public: "Mode public"
};

export function DropMapAdminPreviewBadge({ mode }) {
  return (
    <div className={styles.previewBadge} aria-label={`Prévisualisation administrateur, ${MODE_LABELS[mode] || "mode privé"}`}>
      <span>Prévisualisation administrateur</span>
      <strong>{MODE_LABELS[mode] || "Mode privé"}</strong>
    </div>
  );
}
