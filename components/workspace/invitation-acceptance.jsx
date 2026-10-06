"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { requestCoreJson } from "@/lib/http/core-request";

export function InvitationAcceptance({ token, labels }) {
  const router = useRouter();
  const [state, setState] = useState({ status: "idle", message: "" });
  async function accept() {
    setState({ status: "loading", message: labels.processing });
    try {
      const result = await requestCoreJson("/api/team/invitations/accept", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token })
      });
      if (!result.spaceId) throw new Error("Missing space ID");
      setState({ status: "success", message: labels.invitationAccepted });
      router.push(`/espace/${result.spaceId}`); router.refresh();
    } catch (error) {
      setState({ status: "error", message: error.result?.error || labels.genericError });
    }
  }
  return <div>
    <button className="button button-primary" onClick={accept} disabled={state.status === "loading"}>{labels.acceptInvitation}</button>
    <p role={state.status === "error" ? "alert" : "status"} className={`identity-feedback ${state.status}`}>{state.message}</p>
  </div>;
}
