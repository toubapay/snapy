import { useEffect, useState } from "react";
import { api, ApiError } from "../api";

export default function AuthModal({ open, mode, onModeChange, onClose, onAuthed }) {
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [storeName, setStoreName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setPhone("");
      setPin("");
      setStoreName("");
      setError("");
    }
  }, [open, mode]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape" && open) onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const data =
        mode === "login" ? await api.login(phone.trim(), pin.trim()) : await api.register(phone.trim(), pin.trim(), storeName.trim());
      onAuthed({ token: data.token, phone: data.phone, maskedPhone: data.maskedPhone, storeName: data.storeName || "" });
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur s'est produite.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="auth-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="auth-panel">
        <button type="button" className="cam-icon-btn auth-close" aria-label="Fermer" onClick={onClose}>
          ✕
        </button>
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab${mode === "login" ? " active" : ""}`}
            onClick={() => onModeChange("login")}
          >
            Connexion
          </button>
          <button
            type="button"
            className={`auth-tab${mode === "register" ? " active" : ""}`}
            onClick={() => onModeChange("register")}
          >
            Inscription
          </button>
        </div>
        <p className="auth-sub">
          {mode === "login"
            ? "Connectez-vous avec votre numéro de téléphone vendeur et votre code PIN."
            : "Inscrivez-vous avec un numéro de téléphone et un code PIN de 4 à 6 chiffres — aucun e-mail requis."}
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="tel"
            placeholder="Numéro de téléphone — ex. +221771234567"
            required
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <input
            type="password"
            placeholder="Code PIN (4 à 6 chiffres)"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            required
            autoComplete="off"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
          />
          {mode === "register" && (
            <input
              type="text"
              placeholder="Nom de la boutique (facultatif)"
              maxLength={40}
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
            />
          )}
          <button type="submit" disabled={submitting}>
            {mode === "login" ? "Se connecter" : "Créer un compte"}
          </button>
        </form>
        <p className="auth-error">{error}</p>
      </div>
    </div>
  );
}
