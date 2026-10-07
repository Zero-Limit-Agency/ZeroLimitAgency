"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader, StatusBadge } from "@/components/workspace/page-header";
import { WorkspaceSettingsForm } from "@/components/workspace/workspace-settings-form";

export function WorkspaceSettingsClient({ initialSpace, labels }) {
  const [space, setSpace] = useState(initialSpace);
  return <section className="workspace-settings">
    <PageHeader eyebrow={labels.settings.title} title={space.name} status={<StatusBadge tone={space.status === "active" ? "active" : space.status === "suspended" ? "danger" : "neutral"}>{labels.settings.statuses[space.status]}</StatusBadge>} />
    <section className="workspace-settings-summary" aria-label={labels.settings.title}>
      <dl><div><dt>{labels.settings.type}</dt><dd>{labels.groups[space.kind]}</dd></div><div><dt>{labels.owner}</dt><dd>{space.owner.name}</dd></div>{space.kind === "personal" && <div><dt>{labels.settings.profession}</dt><dd>{labels.professions[space.profession]} · {labels.settings.immutable}</dd></div>}{space.kind === "team" && <><div><dt>{labels.organization}</dt><dd>{space.organization.name}</dd></div><div><dt>{labels.settings.slug}</dt><dd>{space.organization.slug}</dd></div></>}</dl>
    </section>
    <WorkspaceSettingsForm space={space} labels={labels} onSpaceChange={setSpace} />
    <Link className="workspace-button workspace-button-ghost" href={space.status === "active" ? `/espace/${space.id}` : "/espace"}>{labels.back}</Link>
  </section>;
}
