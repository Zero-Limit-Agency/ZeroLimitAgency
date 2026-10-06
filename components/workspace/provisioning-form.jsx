"use client";

import { requestCoreJson } from "@/lib/http/core-request";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export function ProvisioningForm({ kind, labels, existingProfessions = [], creatorExists = false }) {
  const router = useRouter();
  const [profession, setProfession] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [state, setState] = useState({ status: "idle", message: "" });
  const derivedSlug = useMemo(() => name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 63), [name]);
  async function submit(event) {
    event.preventDefault(); setState({ status: "loading", message: labels.processing });
    try {
      const result = await requestCoreJson("/api/spaces/provision", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, profession, name, slug: slug || derivedSlug }) });
      if (!result.spaceId) throw new Error("Missing space ID");
      setState({ status: "success", message: labels.ready }); router.push(`/espace/${result.spaceId}`); router.refresh();
    } catch (error) {
      setState({ status: "error", message: error.result?.error || labels.genericError });
    }
  }
  if (kind === "creator" && creatorExists) return <p role="status" className="provision-notice">{labels.alreadyActive}</p>;
  return <form className="provision-form" onSubmit={submit} aria-busy={state.status === "loading"}>
    {kind === "personal" && <fieldset><legend>{labels.chooseProfession}</legend><div className="profession-options">{Object.entries(labels.professions).map(([value, label]) => { const exists = existingProfessions.includes(value); return <label key={value} className={exists ? "is-disabled" : ""}><input type="radio" name="profession" value={value} checked={profession === value} onChange={() => { setProfession(value); setConfirmed(false); }} disabled={exists} required /><span><strong>{label}</strong>{exists && <small>{labels.alreadyActive}</small>}</span></label>; })}</div></fieldset>}
    {kind === "team" && <div className="team-fields"><label>{labels.organizationName}<input value={name} onChange={(event) => { setName(event.target.value); if (!slug) setSlug(""); }} maxLength={100} required /></label><label>{labels.slug}<input value={slug || derivedSlug} onChange={(event) => setSlug(event.target.value.toLowerCase())} pattern="[a-z0-9][a-z0-9-]{2,62}" minLength={3} maxLength={63} required /></label></div>}
    {!confirmed ? <button className="button button-primary" type="button" disabled={(kind === "personal" && !profession) || (kind === "team" && (!name || !(slug || derivedSlug)))} onClick={() => setConfirmed(true)}>{labels.review}</button> : <div className="provision-confirm" role="group" aria-label={labels.confirmation}><strong>{labels.confirmation}</strong><p>{kind === "personal" ? labels.professions[profession] : kind === "creator" ? labels.groups.creator : `${name} · ${slug || derivedSlug}`}</p><p>{labels.noPayment}</p><button className="button button-primary" disabled={state.status === "loading"}>{kind === "creator" ? labels.activateCreator : labels.createSpace}</button><button className="button" type="button" onClick={() => setConfirmed(false)}>{labels.modify}</button></div>}
    <p className={`identity-feedback ${state.status}`} role={state.status === "error" ? "alert" : "status"}>{state.message}</p>
  </form>;
}
