"use client";

import { useId, useState } from "react";

export function PasswordField({ label, name, autoComplete, error, ...inputProps }) {
  const generatedId = useId();
  const [visible, setVisible] = useState(false);
  const inputId = inputProps.id || `${generatedId}-${name}`;
  const errorId = error ? `${inputId}-error` : undefined;

  return <div className="identity-field">
    <label htmlFor={inputId}>{label}</label>
    <div className="identity-password-wrap">
      <input {...inputProps} id={inputId} name={name} type={visible ? "text" : "password"} autoComplete={autoComplete} aria-invalid={Boolean(error)} aria-describedby={errorId} />
      <button type="button" className="identity-password-toggle" aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"} aria-pressed={visible} onClick={() => setVisible(value => !value)}>
        {visible ? "Masquer" : "Afficher"}
      </button>
    </div>
    {error ? <p className="identity-field-error" id={errorId}>{error}</p> : null}
  </div>;
}
