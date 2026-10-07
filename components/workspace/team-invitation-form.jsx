"use client";

import { useState } from "react";
import { requestCoreJson } from "@/lib/http/core-request";

export function TeamInvitationForm({ organizationId, spaceId, labels, onSuccess }) {
  const [state, setState] = useState({ status: "idle", message: "", url: "" });
  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setState({ status: "loading", message: labels.processing, url: "" });
    try {
      const result = await requestCoreJson("/api/team/invitations", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId, spaceId, email: data.get("email"), role: data.get("role") })
      });
      if (result.delivery !== "sent") throw new Error("Email not sent");
      setState({ status: "success", message: labels.invitationSent, url: result.previewUrl || "" });
      form.reset(); onSuccess?.(result.invitation);
    } catch (error) {
      setState({ status: "error", message: error.result?.error || labels.genericError, url: error.result?.previewUrl || "" });
      // The invitation is persisted before delivery. Keep it visible for resend
      // even when the email fails, and preserve the entered form values.
      if (error.result?.mutationApplied) onSuccess?.(error.result.invitation);
    }
  }
  return <form className="invite-form" onSubmit={submit} aria-busy={state.status === "loading"}>
    <h2>{labels.inviteMember}</h2>
    <label>{labels.email}<input name="email" type="email" required /></label>
    <label>{labels.role}<select name="role"><option value="member">{labels.roles.member}</option><option value="admin">{labels.roles.admin}</option></select></label>
    <button className="button button-primary" disabled={state.status === "loading"}>{labels.sendInvitation}</button>
    <p role={state.status === "error" ? "alert" : "status"} className={`identity-feedback ${state.status}`}>{state.message}</p>
    {state.url && <a href={state.url}>{labels.previewInvitation}</a>}
  </form>;
}
