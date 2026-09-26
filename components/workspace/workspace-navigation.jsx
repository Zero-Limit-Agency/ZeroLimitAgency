"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function WorkspaceNavigation({ currentSpace, modules, labels }) {
  const pathname = usePathname();
  const items = [
    { key: "overview", href: `/espace/${currentSpace.id}`, label: labels.overview || "Aperçu", exact: true },
    ...modules.map((module) => ({ key: module.key, href: module.href.replace("[spaceId]", currentSpace.id), label: labels[module.labelKey] || module.labelKey })),
    ...(currentSpace.kind === "team" ? [{ key: "members", href: `/espace/${currentSpace.id}/membres`, label: labels.teamManagement.manageMembers }] : []),
    { key: "settings", href: `/espace/${currentSpace.id}/settings`, label: labels.settings.title }
  ];

  return <nav className="workspace-context-nav" aria-label={labels.modules || "Navigation de l’espace"}>
    {items.map((item) => {
      const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
      return <Link key={item.key} href={item.href} aria-current={active ? "page" : undefined}>{item.label}</Link>;
    })}
  </nav>;
}
