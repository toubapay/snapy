import { useEffect, useState } from "react";
import PhotoField from "./PhotoField";
import { api, ApiError } from "../api";

export default function EditModal({ open, product, categories, auth, apiBase, onClose, onSaved, onLoggedOut }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && product) {
      setName(product.name);
      setCategory(product.category || "");
      setPhoto(null);
      setError("");
    }
  }, [open, product]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape" && open) onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !product) return null;

  const existingImageUrl = product.imageUrl.startsWith("http") ? product.imageUrl : `${apiBase}${product.imageUrl}`;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const fd = new FormData();
    fd.append("name", name.trim());
    fd.append("category", category);
    if (photo) fd.append("image", photo);

    try {
      const updated = await api.updateProduct(auth.token, product.id, fd);
      onSaved(updated);
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onLoggedOut();
        onClose();
        return;
      }
      setError(err instanceof ApiError ? err.message : "Une erreur s'est produite.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="edit-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="edit-panel">
        <button type="button" className="cam-icon-btn auth-close" aria-label="Fermer" onClick={onClose}>
          ✕
        </button>
        <h3>Modifier l'annonce</h3>
        <form onSubmit={handleSubmit}>
          <PhotoField
            file={photo}
            onFileChange={setPhoto}
            existingImageUrl={existingImageUrl}
            editHint="Cliquez pour remplacer la photo"
            dropzoneClassName="edit-dropzone"
          />
          <input type="text" maxLength={80} placeholder="Nom du produit" required value={name} onChange={(e) => setName(e.target.value)} />
          <select value={category} onChange={(e) => setCategory(e.target.value)} required>
            <option value="" disabled>
              Choisissez une catégorie
            </option>
            {categories.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
          <button type="submit" disabled={submitting}>
            Enregistrer les modifications
          </button>
        </form>
        <p className="edit-msg error">{error}</p>
      </div>
    </div>
  );
}
