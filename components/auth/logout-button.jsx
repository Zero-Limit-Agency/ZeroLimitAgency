"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton({ className = "button button-dark", label = "Se déconnecter" }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    if (loading) {
      return;
    }

    setLoading(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST"
      });
    } finally {
      router.push("/connexion");
      router.refresh();
    }
  }

  return (
    <button className={className} type="button" onClick={handleLogout} disabled={loading}>
      {loading ? "Déconnexion..." : label}
    </button>
  );
}
