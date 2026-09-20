"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { teamInvitationReturnPath } from "@/lib/security/internal-return-url";
export function ConfirmationSession() { const router = useRouter(); const [message,setMessage]=useState("Validation de votre session…"); useEffect(() => { const hash=new URLSearchParams(location.hash.slice(1)); const next=teamInvitationReturnPath(new URLSearchParams(location.search).get("next"));fetch("/api/id/session",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({accessToken:hash.get("access_token"),refreshToken:hash.get("refresh_token"),expiresIn:hash.get("expires_in")})}).then(async r=>{if(!r.ok) throw new Error(); history.replaceState(null,"",location.pathname); router.replace(next);router.refresh();}).catch(()=>setMessage("Ce lien est invalide ou expiré. Recommencez depuis la connexion.")); },[router]); return <p role="status">{message}</p>; }
