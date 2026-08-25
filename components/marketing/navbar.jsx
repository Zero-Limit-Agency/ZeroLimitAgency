"use client";
import { useState } from "react";
import Link from "next/link";
import { Button, IconButton } from "./ui";

export function Navbar({ labels, currentUser }) {
  const [open, setOpen] = useState(false);
  return <header className="zl-header"><div className="zl-container"><nav className="zl-navbar" aria-label="Navigation principale"><Link className="zl-brand" href="#top" onClick={() => setOpen(false)}><img src="/assets/zero-limit-logo.png" alt=""/><span>ZERO LIMIT<small>AGENCY</small></span></Link><div className={`zl-nav-links ${open ? "is-open" : ""}`}>{labels.links.map(link => <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>{link.label}</Link>)}<div className="zl-nav-actions"><Button href={currentUser?.href || "/connexion"} variant="ghost" size="sm">{currentUser?.label || labels.login}</Button><Button href="#spaces" size="sm">{labels.cta}</Button></div></div><IconButton label={open ? "Fermer le menu" : "Ouvrir le menu"} icon={open ? "close" : "menu"} onClick={() => setOpen(!open)} aria-expanded={open}/></nav></div></header>;
}
