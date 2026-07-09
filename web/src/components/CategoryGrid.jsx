export default function CategoryGrid({ categories, onSelect }) {
  if (!categories.length) {
    return <p className="empty-inline">Impossible de charger les catégories.</p>;
  }
  return (
    <div className="category-grid">
      {categories.map((c) => (
        <button key={c.name} type="button" className="category-tile" onClick={() => onSelect(c.name)}>
          <span className="cat-name">{c.name}</span>
          <span className="cat-count">
            {c.count} annonce{c.count === 1 ? "" : "s"}
          </span>
        </button>
      ))}
    </div>
  );
}
