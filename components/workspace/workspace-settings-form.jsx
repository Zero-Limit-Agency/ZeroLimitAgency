"use client";

import { requestCoreJson } from "@/lib/http/core-request";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function WorkspaceSettingsForm({ space, labels, onSpaceChange }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState("");
  const settings = labels.settings;
  async function submit(operation, value) {
    setPending(true); setFeedback("");
    try {
      await requestCoreJson(`/api/spaces/${encodeURIComponent(space.id)}/settings`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ operation, value }) });
      onSpaceChange(operation === "archive"
        ? { ...space, status: "archived" }
        : operation === "restore"
          ? { ...space, status: "active" }
          : operation === "change_slug"
            ? { ...space, organization: { ...space.organization, slug: value } }
            : { ...space, name: value });
      setFeedback(settings.saved);
      router.refresh();
    } catch (error) {
      setFeedback(settings.errors[error.result?.code] || settings.errors.unexpected_error);
    } finally { setPending(false); }
  }
  if (!space.isOwner) return <p className="settings-notice workspace-inset" role="status">{settings.readOnly}</p>;
  const renameOperation = space.kind === "team" ? "rename_team" : space.kind === "creator" ? "rename_creator" : "rename_personal";
  return <div className="settings-actions workspace-panel">
    {space.status === "active" && <form className="workspace-settings-section" onSubmit={(event) => { event.preventDefault(); submit(renameOperation, new FormData(event.currentTarget).get("name")); }}>
      <label htmlFor="space-name">{space.kind === "team" ? settings.organizationName : settings.spaceName}</label>
      <div><input id="space-name" name="name" defaultValue={space.name} minLength={1} maxLength={100} required disabled={pending} /><button disabled={pending}>{settings.rename}</button></div>
    </form>}
    {space.kind === "team" && space.status === "active" && <form className="workspace-settings-section" onSubmit={(event) => { event.preventDefault(); submit("change_slug", new FormData(event.currentTarget).get("slug")); }}>
      <label htmlFor="organization-slug">{settings.slug}</label>
      <div><input id="organization-slug" name="slug" defaultValue={space.organization.slug} pattern="[a-z0-9][a-z0-9-]{2,62}" required disabled={pending} /><button disabled={pending}>{settings.updateSlug}</button></div>
      <small>{settings.slugWarning}</small>
    </form>}
    {space.status === "active" && <div className="workspace-danger-zone"><button className="settings-danger" disabled={pending} onClick={() => window.confirm(settings.archiveConfirm) && submit("archive")}>{settings.archive}</button></div>}
    {space.status === "archived" && <button disabled={pending || !space.entitlementActive} onClick={() => submit("restore")}>{settings.restore}</button>}
    {space.status === "suspended" && <p className="settings-notice">{settings.suspendedReadOnly}</p>}
    <p className="settings-feedback" role="status" aria-live="polite">{feedback}</p>
  </div>;
}
