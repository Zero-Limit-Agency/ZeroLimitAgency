"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const KINDS = ["personal", "creator", "team"];

export function SpaceSwitcher({ spaces, currentSpace, labels }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    menuRef.current?.querySelector("a")?.focus();
    function onKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const currentTitle = currentSpace?.kind === "team" ? currentSpace.organization.name : currentSpace?.name;
  const currentContext = currentSpace?.kind === "personal" ? labels.professions[currentSpace.profession] : currentSpace?.kind ? labels.groups[currentSpace.kind] : labels.switchSpace;

  return <div className="space-switcher">
    <button ref={triggerRef} type="button" className="space-switcher-trigger" aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((value) => !value)}>
      <span className={`space-switcher-icon ${currentSpace?.kind || "all"}`} aria-hidden="true">{currentSpace?.kind === "team" ? "T" : currentSpace?.kind === "creator" ? "C" : currentSpace?.kind === "personal" ? "P" : "Z"}</span>
      <span className="space-switcher-copy"><small>{currentContext}</small><strong>{currentTitle || labels.chooseSpace}</strong></span><span className="space-switcher-chevron" aria-hidden="true">⌄</span>
    </button>
    {open && <div ref={menuRef} className="space-switcher-menu" role="menu" aria-label={labels.chooseSpace}>
      {spaces.length === 0 && <p>{labels.noSpaces}</p>}
      {KINDS.map((kind) => {
        const items = spaces.filter((space) => space.kind === kind);
        if (!items.length) return null;
        return <section key={kind} aria-labelledby={`space-group-${kind}`}><h2 id={`space-group-${kind}`}>{labels.groups[kind]}</h2>{items.map((space) => <Link role="menuitem" key={space.id} href={`/espace/${encodeURIComponent(space.id)}/activer`} onClick={() => setOpen(false)} aria-current={currentSpace?.id === space.id ? "page" : undefined}>
          <span className={`space-switcher-icon ${space.kind}`} aria-hidden="true">{space.kind === "team" ? "T" : space.kind === "creator" ? "C" : "P"}</span>
          <span className="space-switcher-item-copy"><span className="space-switcher-name">{space.kind === "team" ? space.organization.name : space.name}</span><small>{space.kind === "personal" ? labels.professions[space.profession] : space.kind === "team" ? `${labels.groups.team} · ${labels.roles[space.role]}` : labels.groups.creator}</small></span>
          {currentSpace?.id === space.id && <span className="space-switcher-check" aria-hidden="true">✓</span>}
        </Link>)}</section>;
      })}
      <div className="space-switcher-create" role="group" aria-label={labels.createOrJoinSpace}>
        <div role="separator" />
        <Link role="menuitem" href="/espace" onClick={() => setOpen(false)}>
          <span aria-hidden="true">＋</span>
          <span>{labels.createOrJoinSpace}</span>
        </Link>
      </div>
    </div>}
  </div>;
}
