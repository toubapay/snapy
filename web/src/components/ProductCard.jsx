function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "à l'instant";
  const m = Math.floor(s / 60);
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h} h`;
  return `il y a ${Math.floor(h / 24)} j`;
}

function digitsOnly(str = "") {
  return str.replace(/[^\d]/g, "");
}

export default function ProductCard({ product: p, mine, isNew, apiBase, onOpenChat, onOpenBoutique, onEdit, onDelete }) {
  const imageUrl = p.imageUrl.startsWith("http") ? p.imageUrl : `${apiBase}${p.imageUrl}`;

  return (
    <article className={`card${isNew ? " card-new" : ""}`}>
      <div className="photo-wrap">
        <img className="photo" src={imageUrl} alt={p.name} loading="lazy" />
        <span className="vendor-tag">{p.vendorId}</span>
      </div>
      <div className="stub">
        <p className="pname">{p.name}</p>
        <p className="pdesc">{p.description}</p>

        {!mine && (
          <button type="button" className="vendor-line" onClick={() => onOpenBoutique(p.sellerPhone, p.storeName || p.vendorId)}>
            🏪 {p.storeName || p.vendorId}
            {p.storeName ? ` · ${p.ownerLabel || p.vendorId}` : ""}
          </button>
        )}

        <div className="card-actions">
          {mine ? (
            <>
              <button type="button" className="icon-btn edit-btn" onClick={() => onEdit(p.id)}>
                ✏️ Modifier
              </button>
              <button type="button" className="icon-btn delete-btn" onClick={() => onDelete(p.id)}>
                🗑️ Supprimer
              </button>
            </>
          ) : (
            <>
              <button type="button" className="icon-btn chat-btn" onClick={() => onOpenChat(p)}>
                💬 Discuter avec le vendeur
              </button>
              {p.contact && (
                <a
                  className="icon-btn whatsapp-btn"
                  target="_blank"
                  rel="noopener"
                  href={`https://wa.me/${digitsOnly(p.contact)}?text=${encodeURIComponent(
                    "Bonjour ! Je suis intéressé(e) par " + p.name + " sur Snapy."
                  )}`}
                >
                  🟢 WhatsApp
                </a>
              )}
            </>
          )}
        </div>
        <span className="ptime">{timeAgo(p.createdAt)}</span>
      </div>
    </article>
  );
}
