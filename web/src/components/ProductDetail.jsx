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

export default function ProductDetail({ product, apiBase, onBack, onOpenBoutique, onOpenChat }) {
  if (!product) return null;

  const imageUrl = product.imageUrl.startsWith("http") ? product.imageUrl : `${apiBase}${product.imageUrl}`;
  const audioUrl = product.audioUrl ? (product.audioUrl.startsWith("http") ? product.audioUrl : `${apiBase}${product.audioUrl}`) : null;
  const phoneDigits = digitsOnly(product.contact);

  return (
    <section className="feed product-detail">
      <div className="feed-head">
        <button type="button" className="feed-back" onClick={onBack}>
          ← Retour aux annonces
        </button>
        <h2>{product.name}</h2>
      </div>

      <div className="detail-card">
        <div className="detail-photo-wrap">
          <img className="detail-photo" src={imageUrl} alt={product.name} />
          <span className="vendor-tag">{product.vendorId}</span>
        </div>

        <div className="detail-body">
          <p className="detail-desc">{product.description}</p>
          {audioUrl && <audio className="detail-voice" controls src={audioUrl} />}

          <button
            type="button"
            className="vendor-line detail-boutique-link"
            onClick={() => onOpenBoutique(product.sellerPhone, product.storeName || product.vendorId)}
          >
            🏪 {product.storeName || product.vendorId}
            {product.storeName ? ` · ${product.ownerLabel || product.vendorId}` : ""}
          </button>

          <div className="card-actions detail-contact-actions">
            <button type="button" className="icon-btn chat-btn" onClick={() => onOpenChat(product)}>
              💬 Discuter en direct
            </button>
            {!!phoneDigits && (
              <a className="icon-btn phone-btn" href={`tel:+${phoneDigits}`}>
                📞 Appeler
              </a>
            )}
            {!!phoneDigits && (
              <a
                className="icon-btn whatsapp-btn"
                target="_blank"
                rel="noopener"
                href={`https://wa.me/${phoneDigits}?text=${encodeURIComponent(
                  "Bonjour ! Je suis intéressé(e) par " + product.name + " sur Snapy."
                )}`}
              >
                🟢 WhatsApp
              </a>
            )}
          </div>

          <span className="ptime">{timeAgo(product.createdAt)}</span>
        </div>
      </div>
    </section>
  );
}
