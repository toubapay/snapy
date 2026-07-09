import { useEffect, useState } from "react";
import { api, ApiError } from "../api";

export default function AccountModal({ open, auth, onClose, onPatchAuth, onLoggedOut, onAccountDeleted }) {
  const [storeName, setStoreName] = useState("");
  const [profileMsg, setProfileMsg] = useState({ text: "", type: "" });
  const [profileSubmitting, setProfileSubmitting] = useState(false);

  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [pinMsg, setPinMsg] = useState({ text: "", type: "" });
  const [pinSubmitting, setPinSubmitting] = useState(false);

  const [deleteMsg, setDeleteMsg] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!open || !auth) return;
    setStoreName(auth.storeName || "");
    setProfileMsg({ text: "", type: "" });
    setPinMsg({ text: "", type: "" });
    setDeleteMsg("");
    setCurrentPin("");
    setNewPin("");

    api
      .me(auth.token)
      .then((data) => {
        setStoreName(data.storeName || "");
        onPatchAuth({ storeName: data.storeName || "" });
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          onLoggedOut();
          onClose();
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape" && open) onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !auth) return null;

  async function handleProfileSubmit(e) {
    e.preventDefault();
    setProfileMsg({ text: "", type: "" });
    setProfileSubmitting(true);
    try {
      const data = await api.updateProfile(auth.token, { storeName: storeName.trim() });
      onPatchAuth({ storeName: data.storeName || "" });
      setProfileMsg({ text: "Profil mis à jour.", type: "ok" });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onLoggedOut();
        onClose();
        return;
      }
      setProfileMsg({ text: err.message, type: "error" });
    } finally {
      setProfileSubmitting(false);
    }
  }

  async function handlePinSubmit(e) {
    e.preventDefault();
    setPinMsg({ text: "", type: "" });
    setPinSubmitting(true);
    try {
      await api.updateProfile(auth.token, { currentPin: currentPin.trim(), newPin: newPin.trim() });
      setCurrentPin("");
      setNewPin("");
      setPinMsg({ text: "Code PIN mis à jour.", type: "ok" });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onLoggedOut();
        onClose();
        return;
      }
      setPinMsg({ text: err.message, type: "error" });
    } finally {
      setPinSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Supprimer définitivement votre compte et toutes vos annonces ? Cette action est irréversible.")) return;
    setDeleteMsg("");
    setDeleting(true);
    try {
      await api.deleteAccount(auth.token);
      onAccountDeleted();
      onClose();
    } catch (err) {
      setDeleteMsg(err instanceof ApiError ? err.message : "Une erreur s'est produite.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div
      className="account-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="account-panel">
        <button type="button" className="cam-icon-btn auth-close" aria-label="Fermer" onClick={onClose}>
          ✕
        </button>
        <h3>Mon compte</h3>
        <p className="account-phone">Numéro : {auth.maskedPhone}</p>

        <form className="account-form" onSubmit={handleProfileSubmit}>
          <label className="account-label">Nom de la boutique</label>
          <input type="text" maxLength={40} placeholder="ex. Boutique Fatou" value={storeName} onChange={(e) => setStoreName(e.target.value)} />
          <button type="submit" disabled={profileSubmitting}>
            Enregistrer le profil
          </button>
        </form>
        <p className={`account-msg${profileMsg.type ? " " + profileMsg.type : ""}`}>{profileMsg.text}</p>

        <form className="account-form" onSubmit={handlePinSubmit}>
          <label className="account-label">Changer le code PIN</label>
          <input
            type="password"
            placeholder="Code PIN actuel"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            autoComplete="off"
            value={currentPin}
            onChange={(e) => setCurrentPin(e.target.value)}
          />
          <input
            type="password"
            placeholder="Nouveau code PIN (4 à 6 chiffres)"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            autoComplete="off"
            value={newPin}
            onChange={(e) => setNewPin(e.target.value)}
          />
          <button type="submit" disabled={pinSubmitting}>
            Changer le code PIN
          </button>
        </form>
        <p className={`account-msg${pinMsg.type ? " " + pinMsg.type : ""}`}>{pinMsg.text}</p>

        <div className="account-danger">
          <button
            type="button"
            className="account-secondary-btn"
            onClick={() => {
              onLoggedOut();
              onClose();
            }}
          >
            Se déconnecter
          </button>
          <button type="button" className="account-danger-btn" onClick={handleDelete} disabled={deleting}>
            Supprimer mon compte
          </button>
        </div>
        <p className="account-msg error">{deleteMsg}</p>
      </div>
    </div>
  );
}
