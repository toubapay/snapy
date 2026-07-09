export default function TopBar({ auth, onOpenAuth, onOpenAccount }) {
  return (
    <header className="topbar">
      <div className="brand">
        <img className="logo-mark" src="/logo.svg" alt="" width="28" height="28" />
        <span className="mark">Snapy</span>
      </div>
      <span className="tagline">une photo. une annonce. vendu.</span>
      <div className="account-bar">
        {auth ? (
          <button type="button" className="account-btn manage-btn" onClick={onOpenAccount}>
            {auth.storeName ? `🏪 ${auth.storeName}` : `Mon compte · ${auth.maskedPhone}`}
          </button>
        ) : (
          <button type="button" className="account-btn" onClick={() => onOpenAuth("login")}>
            Se connecter pour vendre
          </button>
        )}
      </div>
    </header>
  );
}
