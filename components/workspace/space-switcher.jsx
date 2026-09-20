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

  return <div className="space-switcher">
    <button ref={triggerRef} type="button" className="space-switcher-trigger" aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((value) => !value)}>
      <span><small>{labels.switchSpace}</small><strong>{currentSpace?.name || labels.chooseSpace}</strong></span><span aria-hidden="true">⌄</span>
    </button>
    {open && <div ref={menuRef} className="space-switcher-menu" role="menu" aria-label={labels.chooseSpace}>
      {spaces.length === 0 && <p>{labels.noSpaces}</p>}
      {KINDS.map((kind) => {
        const items = spaces.filter((space) => space.kind === kind);
        if (!items.length) return null;
        return <section key={kind} aria-labelledby={`space-group-${kind}`}><h2 id={`space-group-${kind}`}>{labels.groups[kind]}</h2>{items.map((space) => <Link role="menuitem" key={space.id} href={`/espace/${encodeURIComponent(space.id)}/activer`} onClick={() => setOpen(false)} aria-current={currentSpace?.id === space.id ? "page" : undefined}>
          <span className="space-switcher-name">{space.kind === "team" ? space.organization.name : space.name}</span>
          <small>{space.kind === "personal" ? labels.professions[space.profession] : space.kind === "team" ? labels.roles[space.role] : labels.groups.creator}</small>
        </Link>)}</section>;
      })}
    </div>}
  </div>;
}
