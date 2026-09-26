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
    <div className="space-placeholder"><p>{moduleText}</p></div>
    <Link className="team-management-link" href={`/espace/${space.id}/settings`}>{labels.settings.title}</Link>
    {space.kind === "team" && <Link className="team-management-link" href={`/espace/${space.id}/membres`}>{labels.teamManagement.manageMembers}</Link>}
  </section>;
}
