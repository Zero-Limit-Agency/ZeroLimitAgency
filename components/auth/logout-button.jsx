"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton({ className = "button button-dark", label = "Se déconnecter" }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogout() {
    if (loading) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST"
      });
      if (!response.ok) throw new Error("Logout failed");
      router.push("/connexion");
      router.refresh();
    } catch {
      setError("Déconnexion impossible. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <><button className={className} type="button" onClick={handleLogout} disabled={loading}>
      {loading ? "Déconnexion..." : label}
    </button>{error && <span role="alert">{error}</span>}</>
  );
}
