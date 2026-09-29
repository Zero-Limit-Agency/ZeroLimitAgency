"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const PRIMARY_MODULE_LIMIT = 6;

function NavIcon({ name }) {
  return <span className={`workspace-nav-icon icon-${name}`} aria-hidden="true" />;
}

function NavLink({ item, pathname, onNavigate }) {
  const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
  return <Link href={item.href} aria-current={active ? "page" : undefined} onClick={onNavigate}>
    <NavIcon name={item.icon} /><span>{item.label}</span>
  </Link>;
}

export function WorkspaceNavigation({ currentSpace, modules, labels, account }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const sidebarRef = useRef(null);
  const moduleItems = modules.map((module) => ({
    key: module.key,
    href: module.href.replace("[spaceId]", encodeURIComponent(currentSpace.id)),
    label: labels[module.labelKey] || module.labelKey,
    icon: module.icon || "module"
  }));
  const primaryModules = moduleItems.filter((item, index) => modules[index].priority !== "overflow").slice(0, PRIMARY_MODULE_LIMIT);
  const overflowModules = moduleItems.filter((item) => !primaryModules.includes(item));
  const manageItems = [
    ...(currentSpace.kind === "team" ? [{ key: "members", href: `/espace/${encodeURIComponent(currentSpace.id)}/membres`, label: labels.teamManagement.manageMembers, icon: "members" }] : []),
    { key: "settings", href: `/espace/${encodeURIComponent(currentSpace.id)}/settings`, label: labels.settings.title, icon: "settings" }
  ];

  useEffect(() => {
    if (!mobileOpen) return undefined;
    sidebarRef.current?.querySelector("a")?.focus();
    const close = (event) => event.key === "Escape" && setMobileOpen(false);
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [mobileOpen]);

  const closeMobile = () => setMobileOpen(false);
  return <>
    <button className="workspace-mobile-nav-trigger" type="button" aria-expanded={mobileOpen} aria-controls="workspace-sidebar" onClick={() => setMobileOpen((value) => !value)}>
      <span aria-hidden="true">☰</span>{labels.navigation?.open || "Navigation"}
    </button>
    {mobileOpen && <button className="workspace-nav-scrim" type="button" aria-label={labels.navigation?.close || "Fermer la navigation"} onClick={closeMobile} />}
    <aside ref={sidebarRef} id="workspace-sidebar" className={`workspace-sidebar${mobileOpen ? " is-open" : ""}`} aria-label={labels.modules || "Navigation de l’espace"}>
      <div className="workspace-sidebar-context">
        <small>{labels.groups[currentSpace.kind]}</small>
        <strong>{currentSpace.kind === "team" ? currentSpace.organization.name : currentSpace.name}</strong>
        <span>{currentSpace.kind === "personal" ? labels.professions[currentSpace.profession] : currentSpace.kind === "team" ? labels.roles[currentSpace.role] : labels.groups.creator}</span>
      </div>
      <nav className="workspace-space-navigation">
        <section aria-labelledby="workspace-section-space"><h2 id="workspace-section-space">{labels.navigation?.space || "Espace"}</h2>
          <NavLink pathname={pathname} onNavigate={closeMobile} item={{ key: "overview", href: `/espace/${encodeURIComponent(currentSpace.id)}`, label: labels.overview || "Aperçu", exact: true, icon: "overview" }} />
        </section>
        <section aria-labelledby="workspace-section-work"><h2 id="workspace-section-work">{labels.navigation?.work || "Travail"}</h2>
          {primaryModules.map((item) => <NavLink key={item.key} item={item} pathname={pathname} onNavigate={closeMobile} />)}
          {!moduleItems.length && <p className="workspace-nav-empty">{labels.navigation?.noModules || "Aucun module actif"}</p>}
          {!!overflowModules.length && <>
            <button className="workspace-more-trigger" type="button" aria-expanded={moreOpen} aria-controls="workspace-module-overflow" onClick={() => setMoreOpen((value) => !value)}><NavIcon name="more" />{labels.navigation?.more || "Plus"}</button>
            {moreOpen && <div id="workspace-module-overflow">{overflowModules.map((item) => <NavLink key={item.key} item={item} pathname={pathname} onNavigate={closeMobile} />)}</div>}
          </>}
        </section>
        <section aria-labelledby="workspace-section-manage"><h2 id="workspace-section-manage">{labels.navigation?.manage || "Gérer"}</h2>
          {manageItems.map((item) => <NavLink key={item.key} item={item} pathname={pathname} onNavigate={closeMobile} />)}
        </section>
      </nav>
      <div className="workspace-sidebar-account">{account}</div>
    </aside>
  </>;
}
