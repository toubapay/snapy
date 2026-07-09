import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "./api";
import { useAuth } from "./hooks/useAuth";
import TopBar from "./components/TopBar";
import MainNav from "./components/MainNav";
import Composer from "./components/Composer";
import Feed from "./components/Feed";
import AuthModal from "./components/AuthModal";
import AccountModal from "./components/AccountModal";
import EditModal from "./components/EditModal";
import ChatModal from "./components/ChatModal";

export default function App() {
  const { auth, setAuth, patchAuth } = useAuth();

  const [view, setView] = useState("all");
  const [activeBoutique, setActiveBoutique] = useState(null); // { phone, label }
  const [activeCategory, setActiveCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [highlightId, setHighlightId] = useState(null);
  const [posting, setPosting] = useState(false);

  const [authModal, setAuthModal] = useState({ open: false, mode: "login" });
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [chatProduct, setChatProduct] = useState(null);

  const loadCategories = useCallback(async () => {
    try {
      setCategories(await api.categories());
    } catch {
      /* leave the previous cache if the refresh fails */
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const refreshFeed = useCallback(async () => {
    if (view === "categories") return;
    if (view === "mine" && !auth) {
      setView("all");
      return;
    }
    try {
      if (view === "mine") {
        setProducts(await api.myProducts(auth.token));
      } else {
        const params = {};
        if (view === "top") params.sort = "top";
        if (view === "boutique" && activeBoutique) params.seller = activeBoutique.phone;
        if (view === "categoryFiltered" && activeCategory) params.category = activeCategory;
        setProducts(await api.products(params));
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401 && view === "mine") {
        setAuth(null);
        setView("all");
      }
    }
  }, [view, activeBoutique, activeCategory, auth, setAuth]);

  useEffect(() => {
    refreshFeed();
  }, [refreshFeed]);

  function switchView(next) {
    setActiveBoutique(null);
    setActiveCategory(null);
    setHighlightId(null);
    setView(next);
  }

  function handleNavSwitch(next) {
    if (next === "mine" && !auth) {
      setAuthModal({ open: true, mode: "login" });
      return;
    }
    switchView(next);
  }

  function openBoutique(phone, label) {
    if (!phone) return;
    setActiveBoutique({ phone, label });
    setActiveCategory(null);
    setHighlightId(null);
    setView("boutique");
  }

  function openCategoryProducts(name) {
    setActiveCategory(name);
    setActiveBoutique(null);
    setHighlightId(null);
    setView("categoryFiltered");
  }

  function handleBack() {
    switchView(view === "categoryFiltered" ? "categories" : "all");
  }

  function handlePosted(product) {
    setHighlightId(product.id);
    setActiveBoutique(null);
    setActiveCategory(null);
    setView("all");
    loadCategories();
    refreshFeed();
  }

  async function handleLoggedOut() {
    if (auth) api.logout(auth.token).catch(() => {});
    setAuth(null);
    if (view === "mine") switchView("all");
  }

  function handleAccountDeleted() {
    setAuth(null);
    if (view === "mine") switchView("all");
    else refreshFeed();
    loadCategories();
  }

  async function handleDeleteProduct(id) {
    if (!auth) return;
    if (!window.confirm("Supprimer définitivement cette annonce ?")) return;
    try {
      await api.deleteProduct(auth.token, id);
      refreshFeed();
      loadCategories();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) handleLoggedOut();
    }
  }

  const titles = {
    all: "Nouvelles annonces",
    top: "Top annonces",
    mine: "Mes annonces",
    categories: "Catégories",
    boutique: activeBoutique ? `🏪 ${activeBoutique.label}` : "",
    categoryFiltered: activeCategory ? `Catégorie : ${activeCategory}` : ""
  };
  const emptyTexts = {
    all: "Aucun produit pour l'instant — soyez le premier à en publier un.",
    top: "Pas encore assez d'activité pour établir un classement.",
    mine: "Vous n'avez encore publié aucune annonce.",
    boutique: "Cette boutique n'a pas encore publié d'annonce.",
    categoryFiltered: "Aucune annonce dans cette catégorie pour l'instant."
  };
  const navActiveView = ["all", "top", "categories", "mine"].includes(view) ? view : null;

  return (
    <>
      <div className="grain" />
      <TopBar auth={auth} onOpenAuth={(mode) => setAuthModal({ open: true, mode })} onOpenAccount={() => setAccountModalOpen(true)} />
      <MainNav activeView={navActiveView} onSwitch={handleNavSwitch} />

      <main>
        <Composer
          auth={auth}
          categories={categories}
          onOpenAuth={(mode) => setAuthModal({ open: true, mode })}
          onPosted={handlePosted}
          onPostingChange={setPosting}
        />

        <Feed
          view={view}
          title={titles[view]}
          emptyText={emptyTexts[view]}
          showBack={view === "boutique" || view === "categoryFiltered"}
          onBack={handleBack}
          products={products}
          categories={categories}
          mine={view === "mine"}
          highlightId={highlightId}
          apiBase={api.base}
          posting={posting}
          onSelectCategory={openCategoryProducts}
          onOpenChat={setChatProduct}
          onOpenBoutique={openBoutique}
          onEdit={(id) => setEditingProduct(products.find((p) => p.id === id) || null)}
          onDelete={handleDeleteProduct}
        />
      </main>

      <footer>
        <span>Snapy mini · conçu avec l'API Claude (vision)</span>
      </footer>

      <AuthModal
        open={authModal.open}
        mode={authModal.mode}
        onModeChange={(mode) => setAuthModal({ open: true, mode })}
        onClose={() => setAuthModal({ open: false, mode: authModal.mode })}
        onAuthed={setAuth}
      />

      <AccountModal
        open={accountModalOpen}
        auth={auth}
        onClose={() => setAccountModalOpen(false)}
        onPatchAuth={patchAuth}
        onLoggedOut={handleLoggedOut}
        onAccountDeleted={handleAccountDeleted}
      />

      <EditModal
        open={!!editingProduct}
        product={editingProduct}
        categories={categories}
        auth={auth}
        apiBase={api.base}
        onClose={() => setEditingProduct(null)}
        onSaved={() => {
          refreshFeed();
          loadCategories();
        }}
        onLoggedOut={handleLoggedOut}
      />

      <ChatModal open={!!chatProduct} product={chatProduct} auth={auth} onClose={() => setChatProduct(null)} />
    </>
  );
}
