"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const OUTPUT_SIZE = 512;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Impossible de charger l'image sélectionnée."));
    image.src = src;
  });
}

async function buildCroppedAvatarFile(file, editorState) {
  const localUrl = URL.createObjectURL(file);

  try {
    const image = await loadImage(localUrl);
    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Le cadrage de l'image est indisponible sur ce navigateur.");
    }

    const baseScale = Math.max(OUTPUT_SIZE / image.width, OUTPUT_SIZE / image.height);
    const zoom = Number(editorState.zoom || 1);
    const drawWidth = image.width * baseScale * zoom;
    const drawHeight = image.height * baseScale * zoom;
    const overflowX = Math.max(0, drawWidth - OUTPUT_SIZE);
    const overflowY = Math.max(0, drawHeight - OUTPUT_SIZE);
    const drawX = -(Number(editorState.focusX || 50) / 100) * overflowX;
    const drawY = -(Number(editorState.focusY || 50) / 100) * overflowY;

    context.clearRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    context.drawImage(image, drawX, drawY, drawWidth, drawHeight);

    const blob = await new Promise((resolve) => {
      canvas.toBlob(resolve, "image/webp", 0.92);
    });

    if (!blob) {
      throw new Error("Impossible de finaliser la photo de profil.");
    }

    const safeBaseName = file.name.replace(/\.[^.]+$/, "").replace(/\s+/g, "-").toLowerCase() || "avatar";

    return new File([blob], `${safeBaseName}.webp`, {
      type: "image/webp"
    });
  } finally {
    URL.revokeObjectURL(localUrl);
  }
}

export function AvatarUploader({ initialAvatar, initials, disabled = false }) {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(initialAvatar || "");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorImageSrc, setEditorImageSrc] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [editorState, setEditorState] = useState({
    zoom: 1,
    focusX: 50,
    focusY: 50
  });
  const [state, setState] = useState({
    status: "idle",
    message: ""
  });

  const avatarSrc = useMemo(() => preview || initialAvatar || "", [initialAvatar, preview]);

  useEffect(() => {
    return () => {
      if (editorImageSrc) {
        URL.revokeObjectURL(editorImageSrc);
      }
    };
  }, [editorImageSrc]);

  function resetEditor(options = {}) {
    if (editorImageSrc) {
      URL.revokeObjectURL(editorImageSrc);
    }

    setEditorOpen(false);
    setEditorImageSrc("");
    setSelectedFile(null);
    setEditorState({
      zoom: 1,
      focusX: 50,
      focusY: 50
    });

    if (options.clearInput && fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function updateEditorField(field, value) {
    setEditorState((current) => ({
      ...current,
      [field]: Number(value)
    }));
  }

  async function uploadAvatar(fileToUpload) {
    const localPreview = URL.createObjectURL(fileToUpload);
    setPreview(localPreview);
    setState({
      status: "loading",
      message: "Mise à jour de la photo en cours..."
    });

    try {
      const data = new FormData();
      data.append("avatar", fileToUpload, fileToUpload.name);

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
        URL.revokeObjectURL(localPreview);
        setPreview(result.avatar_data_url);
      }

      setState({
        status: "success",
        message: "Photo de profil mise à jour."
      });

      router.refresh();
    } catch (error) {
      URL.revokeObjectURL(localPreview);
      setPreview(initialAvatar || "");
      setState({
        status: "error",
        message:
          error instanceof Error ? error.message : "Impossible de mettre à jour la photo de profil."
      });
    }
  }

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

    const localUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setEditorImageSrc(localUrl);
    setEditorOpen(true);
    setEditorState({
      zoom: 1,
      focusX: 50,
      focusY: 50
    });
    setState({
      status: "idle",
      message: ""
    });
  }

  async function handleApplyAvatar() {
    if (!selectedFile) {
      return;
    }

    try {
      const croppedFile = await buildCroppedAvatarFile(selectedFile, editorState);
      resetEditor({ clearInput: true });
      await uploadAvatar(croppedFile);
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof Error ? error.message : "Impossible d'ajuster la photo de profil."
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
            ref={fileInputRef}
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

      {editorOpen ? (
        <div className="client-avatar-editor-backdrop" role="dialog" aria-modal="true" aria-label="Ajuster la photo de profil">
          <div className="client-avatar-editor">
            <div className="client-avatar-editor-heading">
              <div>
                <p className="eyebrow">Photo de profil</p>
                <h3>Ajuster le cadrage</h3>
              </div>
            </div>

            <div className="client-avatar-editor-preview">
              <div className="client-avatar-editor-crop">
                {editorImageSrc ? (
                  <img
                    src={editorImageSrc}
                    alt=""
                    style={{
                      transform: `scale(${editorState.zoom})`,
                      objectPosition: `${editorState.focusX}% ${editorState.focusY}%`
                    }}
                  />
                ) : null}
              </div>
            </div>

            <div className="client-avatar-editor-controls">
              <label className="auth-field">
                <span>Zoom</span>
                <input
                  type="range"
                  min="1"
                  max="2.4"
                  step="0.01"
                  value={editorState.zoom}
                  onChange={(event) => updateEditorField("zoom", event.target.value)}
                />
              </label>

              <label className="auth-field">
                <span>Position horizontale</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={editorState.focusX}
                  onChange={(event) => updateEditorField("focusX", event.target.value)}
                />
              </label>

              <label className="auth-field">
                <span>Position verticale</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={editorState.focusY}
                  onChange={(event) => updateEditorField("focusY", event.target.value)}
                />
              </label>
            </div>

            <div className="client-avatar-editor-actions">
              <button
                className="button button-dark"
                type="button"
                onClick={() => resetEditor({ clearInput: true })}
              >
                Annuler
              </button>
              <button className="button button-primary" type="button" onClick={handleApplyAvatar}>
                Enregistrer la photo
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
