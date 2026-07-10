import { useState } from "react";
import PhotoField from "./PhotoField";
import AudioField from "./AudioField";
import { api, ApiError } from "../api";

export default function Composer({ auth, categories, onOpenAuth, onPosted, onPostingChange }) {
  const [photo, setPhoto] = useState(null);
  const [audio, setAudio] = useState(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState({ text: "", type: "" });
  const [submitting, setSubmitting] = useState(false);
  const [posting, setPosting] = useState(false);

  if (!auth) {
    return (
      <section className="composer" aria-label="Publier un produit">
        <h1>
          Prenez-le en photo. <span className="accent">Snapez-le, il vend pour vous.</span>
        </h1>
        <div className="composer-locked">
          <p>Connectez-vous avec votre compte vendeur pour publier des produits — les acheteurs pourront vous contacter par chat et WhatsApp.</p>
          <button type="button" className="camera-btn" onClick={() => onOpenAuth("login")}>
            S'inscrire / Se connecter pour vendre
          </button>
        </div>
      </section>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus({ text: "", type: "" });

    if (!photo) {
      setStatus({ text: "Ajoutez d'abord une photo du produit.", type: "error" });
      return;
    }
    if (!category) {
      setStatus({ text: "Choisissez une catégorie pour votre produit.", type: "error" });
      return;
    }

    const fd = new FormData();
    fd.append("image", photo);
    if (audio) fd.append("audio", audio);
    fd.append("name", name.trim());
    fd.append("category", category);

    setSubmitting(true);
    setPosting(true);
    onPostingChange(true);
    setStatus({ text: "Génération d'une description façon Twitter à partir de votre photo…", type: "loading" });

    try {
      const data = await api.createProduct(auth.token, fd);
      setStatus({ text: "Publié → " + data.description, type: "ok" });
      setName("");
      setCategory("");
      setPhoto(null);
      setAudio(null);
      onPosted(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onOpenAuth("login");
      }
      setStatus({ text: err.message, type: "error" });
    } finally {
      setSubmitting(false);
      setPosting(false);
      onPostingChange(false);
    }
  }

  return (
    <section className="composer" aria-label="Publier un produit">
      <h1>
        Prenez-le en photo. <span className="accent">Snapez-le, il vend pour vous.</span>
      </h1>

      <form className="postForm" onSubmit={handleSubmit}>
        <PhotoField file={photo} onFileChange={setPhoto} />

        <div className="field-col">
          <input
            className="nameInput"
            type="text"
            placeholder="Nom du produit — ex. Veste en jean vintage"
            maxLength={80}
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <select className="categoryInput" value={category} onChange={(e) => setCategory(e.target.value)} required>
            <option value="" disabled>
              Choisissez une catégorie
            </option>
            {categories.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          <AudioField file={audio} onFileChange={setAudio} />

          <p className="selling-as">
            Publication en tant que {auth.storeName || auth.maskedPhone} — les acheteurs peuvent vous contacter par chat ou WhatsApp.
          </p>

          <button className="postBtn" type="submit" disabled={submitting}>
            <span>{posting ? "Claude examine la photo…" : "Publier le produit"}</span>
          </button>
        </div>

        <p className={`status${status.type ? " " + status.type : ""}`} aria-live="polite">
          {status.text}
        </p>
      </form>
    </section>
  );
}
