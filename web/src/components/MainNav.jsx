const NAV_ITEMS = [
  { view: "all", label: "Annonces" },
  { view: "top", label: "Top annonces" },
  { view: "categories", label: "Catégories" },
  { view: "mine", label: "Mes annonces" }
];

export default function MainNav({ activeView, onSwitch }) {
  return (
    <nav className="mainnav">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.view}
          type="button"
          className={`nav-link${activeView === item.view ? " active" : ""}`}
          onClick={() => onSwitch(item.view)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
