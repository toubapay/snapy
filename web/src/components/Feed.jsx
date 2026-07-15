import ProductCard from "./ProductCard";
import CategoryGrid from "./CategoryGrid";
import SkeletonCard from "./SkeletonCard";

export default function Feed({
  view,
  title,
  emptyText,
  showBack,
  onBack,
  products,
  categories,
  mine,
  highlightId,
  apiBase,
  posting,
  onSelectCategory,
  onOpenChat,
  onOpenBoutique,
  onOpenDetail,
  onEdit,
  onDelete
}) {
  const isCategories = view === "categories";

  return (
    <section className="feed">
      <div className="feed-head">
        {showBack && (
          <button type="button" className="feed-back" onClick={onBack}>
            ← Retour aux annonces
          </button>
        )}
        <h2>{title}</h2>
        {!isCategories && <span className="count">{products.length}</span>}
      </div>

      {isCategories ? (
        <CategoryGrid categories={categories} onSelect={onSelectCategory} />
      ) : (
        <>
          <div className="grid">
            {posting && view === "all" && <SkeletonCard />}
            {products.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                mine={mine}
                isNew={p.id === highlightId}
                apiBase={apiBase}
                onOpenChat={onOpenChat}
                onOpenBoutique={onOpenBoutique}
                onOpenDetail={onOpenDetail}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
          {products.length === 0 && !posting && (
            <div className="empty">
              <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                <path d="M4 7h16l-1.2 12.5a1.5 1.5 0 0 1-1.5 1.5H6.7a1.5 1.5 0 0 1-1.5-1.5L4 7Z" />
                <path d="M9 7V5.5A3 3 0 0 1 12 2.5a3 3 0 0 1 3 3V7" />
              </svg>
              <p>{emptyText}</p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
