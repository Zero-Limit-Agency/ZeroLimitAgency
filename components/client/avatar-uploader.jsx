"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export function AvatarUploader({ initialAvatar, initials, disabled = false }) {
  const router = useRouter();
  const [preview, setPreview] = useState(initialAvatar || "");
  const [state, setState] = useState({
    status: "idle",
    message: ""
  });

  const avatarSrc = useMemo(() => preview || initialAvatar || "", [initialAvatar, preview]);

  async function handleFileChange(event) {
    const file = event.currentTarget.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setState({
        status: "error",
        message: "Veuillez sélectionner une image valide."
      });
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    setState({
      status: "loading",
      message: "Mise à jour de la photo en cours..."
    });

    try {
      const data = new FormData();
      data.append("avatar", file, file.name);

      const response = await fetch("/api/client/profile/avatar", {
        method: "POST",
        body: data
      });

      const contentType = response.headers.get("content-type") || "";
      const result = contentType.includes("application/json") ? await response.json() : null;

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Impossible de mettre à jour la photo de profil.");
      }

      if (result.avatar_data_url) {
        setPreview(result.avatar_data_url);
      }

      setState({
        status: "success",
        message: "Photo de profil mise à jour."
      });

      router.refresh();
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof Error ? error.message : "Impossible de mettre à jour la photo de profil."
      });
    }
  }

  return (
    <div className="client-avatar-shell">
      <div className="client-profile-avatar client-profile-avatar-large" aria-hidden="true">
        {avatarSrc ? (
          <img
            className="client-profile-avatar-image"
            src={avatarSrc}
            alt=""
            onError={() => setPreview("")}
          />
        ) : (
          initials
        )}
      </div>

      {!disabled ? (
        <label className="client-avatar-button">
          <input
            className="client-avatar-input"
            type="file"
            name="avatar"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileChange}
          />
          <span>Changer la photo</span>
        </label>
      ) : null}

      {state.message ? (
        <p
          className={`auth-feedback ${
            state.status === "error"
              ? "auth-feedback-error"
              : state.status === "success"
                ? "auth-feedback-success"
                : ""
          }`}
        >
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
