import Link from "next/link";
import { PageHeader, StatusBadge } from "@/components/workspace/page-header";

export function SpaceLanding({ space, labels }) {
  const title = space.kind === "team" ? space.organization.name : space.name;
  const moduleText = space.kind === "personal" ? labels.personalModules : space.kind === "creator" ? labels.creatorModules : labels.teamModules;
  return <section className="space-landing">
    <PageHeader eyebrow={labels.groups[space.kind]} title={title} status={<StatusBadge tone="active">{labels.ready}</StatusBadge>} />
    <dl>
      {space.kind === "personal" && <><div><dt>{labels.groups.personal}</dt><dd>{labels.professions[space.profession]}</dd></div><div><dt>{labels.owner}</dt><dd>{space.owner.name}</dd></div></>}
      {space.kind === "team" && <><div><dt>{labels.organization}</dt><dd>{space.organization.name}</dd></div><div><dt>{labels.role}</dt><dd>{labels.roles[space.role]}{space.isOwner ? ` · ${labels.owner}` : ""}</dd></div></>}
    </dl>
    <section className="space-dashboard" aria-labelledby="dashboard-next">
      <div className="space-dashboard-primary"><h2 id="dashboard-next">{labels.dashboard?.next || "À traiter"}</h2><p>{moduleText}</p></div>
      <div className="space-dashboard-secondary"><h2>{labels.dashboard?.activity || "Activité récente"}</h2><p>{labels.dashboard?.emptyActivity || "L’activité de vos futurs modules apparaîtra ici."}</p></div>
    </section>
    {space.kind === "team" && <Link className="team-management-link workspace-button workspace-button-secondary" href={`/espace/${space.id}/membres`}>{labels.teamManagement.manageMembers}</Link>}
  </section>;
}
