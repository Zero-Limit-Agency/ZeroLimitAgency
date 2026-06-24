import Link from "next/link";

import styles from "./dropmap.module.css";

const MODE_LABELS = {
  private: "DropMap privé",
  maintenance: "DropMap en maintenance",
  public: "DropMap public"
};

export function DropMapAdminPreviewBadge({ mode }) {
  return (
    <div className={styles.adminPreviewBadge} role="status">
      <span>Preview administrateur — {MODE_LABELS[mode] || "DropMap privé"}</span>
      <Link href="/admin/dropmap">Gérer</Link>
    </div>
  );
}
