"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";

import { LogoutButton } from "@/components/auth/logout-button";

const navigation = [
  { href: "/admin", label: "Vue d’ensemble", icon: "◆", match: (path, status, section) => path === "/admin" && !status && !section },
  { href: "/admin?status=pending_review", label: "Demandes", icon: "◌", match: (path, status) => (path === "/admin" && ["pending_review", "rejected"].includes(status)) || (path !== "/admin" && !path.startsWith("/admin/formations") && !path.startsWith("/admin/dropmap")) },
  { href: "/admin?status=approved", label: "Clients", icon: "●", match: (path, status) => path === "/admin" && status === "approved" },
  { href: "/admin/formations", label: "Formation YouTube", icon: "▶", match: (path) => path.startsWith("/admin/formations") },
  { href: "/admin/dropmap", label: "DropMap", icon: "◇", match: (path) => path.startsWith("/admin/dropmap") },
  { href: "/admin?section=parametres", label: "Paramètres", icon: "⚙", match: (path, status, section) => path === "/admin" && section === "parametres" }
];

function getContext(pathname, searchParams) {
  const section = searchParams.get("section");
  const status = searchParams.get("status");

  if (pathname.startsWith("/admin/formations")) {
    return {
      eyebrow: "Administration / Formation YouTube",
      title: "Catalogue formation",
      description: "Programme, packs, modules, leçons, ressources, accès et preview dans le shell admin unique.",
      actions: [{ href: "/learn-youtube/espace", label: "Preview formation" }]
    };
  }

  if (pathname.startsWith("/admin/dropmap")) {
    return {
      eyebrow: "Administration / Paramètres",
      title: "Réglages DropMap",
      description: "Pilotez la visibilité confidentielle, la maintenance et l’accès public de DropMap depuis le même admin.",
      actions: [{ href: "/dropmap?admin_preview=1", label: "Preview DropMap" }]
    };
  }

  if (pathname !== "/admin") {
    return {
      eyebrow: "Administration / Dossier",
      title: "Détail candidature ou client",
      description: "Revue, statut, actions client et ressources internes dans la zone centrale de l’administration.",
      actions: [{ href: "/admin", label: "Retour liste" }]
    };
  }

  if (section === "parametres") {
    return {
      eyebrow: "Administration / Paramètres",
      title: "Paramètres globaux",
      description: "Maintenance, visibilité Learn YouTube, CTA public, support et contenus éditables.",
      actions: [{ href: "/admin", label: "Vue d’ensemble" }]
    };
  }

  if (status === "approved") {
    return {
      eyebrow: "Administration / Clients",
      title: "Clients actifs",
      description: "Dossiers validés, accès, collaboration et espaces clients administrables.",
      actions: []
    };
  }

  return {
    eyebrow: "Administration",
    title: "Zero Limit Admin",
    description: "Vue d’ensemble des demandes, clients, formations, réglages et opérations internes.",
    actions: []
  };
}

export function AdminShell({ children, adminEmail }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const status = searchParams.get("status");
  const section = searchParams.get("section");
  const context = getContext(pathname, searchParams);

  return (
    <main className="admin-shell admin-unified-shell">
      <button className="admin-mobile-menu-button" type="button" aria-expanded={open} aria-controls="admin-sidebar" onClick={() => setOpen((value) => !value)}>
        Menu admin
      </button>
      <aside id="admin-sidebar" className={`admin-sidebar${open ? " is-open" : ""}`}>
        <div className="admin-sidebar-brand"><strong>Zero Limit</strong><span>Administration</span></div>
        <nav className="admin-sidebar-nav" aria-label="Navigation administration">
          {navigation.map((item) => {
            const active = item.match(pathname, status, section);
            return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={`admin-sidebar-link${active ? " is-active" : ""}`} onClick={() => setOpen(false)}><span aria-hidden="true">{item.icon}</span>{item.label}</Link>;
          })}
        </nav>
        <div className="admin-sidebar-footer"><Link href="/" className="admin-sidebar-link">↗ Site public</Link><LogoutButton className="admin-sidebar-logout" label="Déconnexion" /></div>
      </aside>
      <section className="admin-frame admin-unified-frame">
        <header className="admin-header admin-unified-header">
          <div>
            <nav className="admin-breadcrumb" aria-label="Fil d’Ariane"><Link href="/admin">Admin</Link><span>/</span><span>{context.title}</span></nav>
            <p className="eyebrow">{context.eyebrow}</p>
            <h1>{context.title}</h1>
            <p className="admin-lead">{context.description}</p>
          </div>
          <div className="admin-header-actions"><span className="admin-profile-pill">{adminEmail || "Admin"}</span>{context.actions.map((action) => <Link key={action.href} className="button button-dark" href={action.href}>{action.label}</Link>)}<LogoutButton label="Se déconnecter" /></div>
        </header>
        {children}
      </section>
    </main>
  );
}
