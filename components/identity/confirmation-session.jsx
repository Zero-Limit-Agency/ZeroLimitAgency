"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { requestCoreJson } from "@/lib/http/core-request";
import { teamInvitationReturnPath } from "@/lib/security/internal-return-url";

export function ConfirmationSession() {
  const router = useRouter();
  const [state, setState] = useState({ status: "loading", message: "Validation de votre session…" });
  const confirm = useCallback(async () => {
    const hash = new URLSearchParams(location.hash.slice(1));
    const next = teamInvitationReturnPath(new URLSearchParams(location.search).get("next"));
    setState({ status: "loading", message: "Validation de votre session…" });
    try {
      await requestCoreJson("/api/id/session", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: hash.get("access_token"), refreshToken: hash.get("refresh_token"), expiresIn: hash.get("expires_in") })
      });
      setState({ status: "success", message: "Votre adresse est confirmée. Redirection…" });
      // The destination has no fragment, so the router navigation clears the
      // tokens without replacing Next.js' managed history state first.
      router.replace(next); router.refresh();
    } catch (error) {
      setState({ status: "error", message: error.result?.error || "Confirmation impossible pour le moment. Réessayez." });
    }
  }, [router]);
  useEffect(() => { confirm(); }, [confirm]);
  return <div className="identity-confirmation">
    <p className={`identity-feedback ${state.status}`} role="status">{state.message}</p>
    {state.status === "error" && <><button className="button button-primary" onClick={confirm}>Réessayer</button><a className="auth-inline-link" href="/connexion">Retour à la connexion</a></>}
  </div>;
}
