const form = document.getElementById("postForm");
const photoInput = document.getElementById("photoInput");
const captureInput = document.getElementById("captureInput");
const dropzone = document.getElementById("dropzone");
const dropzoneInner = document.getElementById("dropzoneInner");
const preview = document.getElementById("preview");
const retakeBtn = document.getElementById("retakeBtn");
const nameInput = document.getElementById("nameInput");
const categoryInput = document.getElementById("categoryInput");
const sellingAs = document.getElementById("sellingAs");
const postBtn = document.getElementById("postBtn");
const postBtnLabel = document.getElementById("postBtnLabel");
const statusLine = document.getElementById("statusLine");
const grid = document.getElementById("grid");
const emptyState = document.getElementById("emptyState");
const countBadge = document.getElementById("countBadge");
const composerLocked = document.getElementById("composerLocked");
const composerLockedBtn = document.getElementById("composerLockedBtn");

const cameraBtn = document.getElementById("cameraBtn");
const cameraModal = document.getElementById("cameraModal");
const cameraVideo = document.getElementById("cameraVideo");
const cameraCanvas = document.getElementById("cameraCanvas");
const cameraError = document.getElementById("cameraError");
const cameraClose = document.getElementById("cameraClose");
const cameraShutter = document.getElementById("cameraShutter");
const cameraSwitch = document.getElementById("cameraSwitch");

const accountBtn = document.getElementById("accountBtn");
const manageAccountBtn = document.getElementById("manageAccountBtn");
const authModal = document.getElementById("authModal");
const authClose = document.getElementById("authClose");
const authForm = document.getElementById("authForm");
const authPhone = document.getElementById("authPhone");
const authPin = document.getElementById("authPin");
const authStoreName = document.getElementById("authStoreName");
const authSubmit = document.getElementById("authSubmit");
const authError = document.getElementById("authError");
const authSub = document.getElementById("authSub");
const tabLogin = document.getElementById("tabLogin");
const tabRegister = document.getElementById("tabRegister");

const accountModal = document.getElementById("accountModal");
const accountClose = document.getElementById("accountClose");
const accountPhone = document.getElementById("accountPhone");
const profileForm = document.getElementById("profileForm");
const storeNameInput = document.getElementById("storeNameInput");
const profileSubmit = document.getElementById("profileSubmit");
const profileMsg = document.getElementById("profileMsg");
const pinForm = document.getElementById("pinForm");
const currentPinInput = document.getElementById("currentPinInput");
const newPinInput = document.getElementById("newPinInput");
const pinSubmit = document.getElementById("pinSubmit");
const pinMsg = document.getElementById("pinMsg");
const logoutFromAccountBtn = document.getElementById("logoutFromAccountBtn");
const deleteAccountBtn = document.getElementById("deleteAccountBtn");
const deleteMsg = document.getElementById("deleteMsg");

const feedTitle = document.getElementById("feedTitle");
const feedBack = document.getElementById("feedBack");
const emptyText = document.getElementById("emptyText");
const categoryGrid = document.getElementById("categoryGrid");

const mainNav = document.getElementById("mainNav");
const navAnnonces = document.getElementById("navAnnonces");
const navTop = document.getElementById("navTop");
const navCategories = document.getElementById("navCategories");
const navMyAds = document.getElementById("navMyAds");

const editModal = document.getElementById("editModal");
const editClose = document.getElementById("editClose");
const editForm = document.getElementById("editForm");
const editPhotoInput = document.getElementById("editPhotoInput");
const editPreview = document.getElementById("editPreview");
const editNameInput = document.getElementById("editNameInput");
const editCategoryInput = document.getElementById("editCategoryInput");
const editSubmit = document.getElementById("editSubmit");
const editMsg = document.getElementById("editMsg");

let currentStream = null;
let facingMode = "environment";
let authMode = "login";
let currentView = "all"; // "all" | "top" | "mine" | "categories" | "boutique" | "categoryFiltered"
let editingProductId = null;
let productsCache = new Map();
let categoriesCache = [];
let activeBoutiquePhone = null;
let activeBoutiqueLabel = "";
let activeCategory = null;

/* ---------- Seller auth (register/login, token stored locally) ---------- */

function getSellerAuth() {
  try {
    return JSON.parse(localStorage.getItem("snapy_seller") || "null");
  } catch {
    return null;
  }
}
function setSellerAuth(auth) {
  localStorage.setItem("snapy_seller", JSON.stringify(auth));
}
function clearSellerAuth() {
  localStorage.removeItem("snapy_seller");
}

// Buyers stay anonymous with a lightweight per-browser tag; sellers use their
// real phone number (from registration/login) as their identity in chat.
function getBuyerId() {
  let id = localStorage.getItem("snapy_buyer_id");
  if (!id) {
    id = "Acheteur-" + Math.random().toString(36).slice(2, 6).toUpperCase();
    localStorage.setItem("snapy_buyer_id", id);
  }
  return id;
}
function getMySenderId() {
  return getSellerAuth()?.phone || getBuyerId();
}

function refreshAccountUI() {
  const auth = getSellerAuth();
  if (auth) {
    accountBtn.hidden = true;
    manageAccountBtn.hidden = false;
    manageAccountBtn.textContent = auth.storeName ? `🏪 ${auth.storeName}` : `Mon compte · ${auth.maskedPhone}`;
    composerLocked.hidden = true;
    form.hidden = false;
    sellingAs.textContent = `Publication en tant que ${auth.storeName || auth.maskedPhone} — les acheteurs peuvent vous contacter par chat ou WhatsApp.`;
  } else {
    accountBtn.hidden = false;
    accountBtn.textContent = "Se connecter pour vendre";
    manageAccountBtn.hidden = true;
    composerLocked.hidden = false;
    form.hidden = true;
    if (currentView === "mine") switchView("all");
  }
}

function openAuthModal(mode = "login") {
  setAuthMode(mode);
  authError.textContent = "";
  authForm.reset();
  authModal.hidden = false;
  authPhone.focus();
}
function closeAuthModal() {
  authModal.hidden = true;
}
function setAuthMode(mode) {
  authMode = mode;
  tabLogin.classList.toggle("active", mode === "login");
  tabRegister.classList.toggle("active", mode === "register");
  authStoreName.hidden = mode !== "register";
  authSubmit.textContent = mode === "login" ? "Se connecter" : "Créer un compte";
  authSub.textContent =
    mode === "login"
      ? "Connectez-vous avec votre numéro de téléphone vendeur et votre code PIN."
      : "Inscrivez-vous avec un numéro de téléphone et un code PIN de 4 à 6 chiffres — aucun e-mail requis.";
  authError.textContent = "";
}

accountBtn.addEventListener("click", () => openAuthModal("login"));
composerLockedBtn.addEventListener("click", () => openAuthModal("login"));
authClose.addEventListener("click", closeAuthModal);
authModal.addEventListener("click", (e) => {
  if (e.target === authModal) closeAuthModal();
});
tabLogin.addEventListener("click", () => setAuthMode("login"));
tabRegister.addEventListener("click", () => setAuthMode("register"));

authForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  authError.textContent = "";
  authSubmit.disabled = true;

  try {
    const body = { phone: authPhone.value.trim(), pin: authPin.value.trim() };
    if (authMode === "register") body.storeName = authStoreName.value.trim();

    const res = await fetch(`/api/sellers/${authMode === "login" ? "login" : "register"}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Une erreur s'est produite.");

    setSellerAuth({ token: data.token, phone: data.phone, maskedPhone: data.maskedPhone, storeName: data.storeName || "" });
    refreshAccountUI();
    closeAuthModal();
  } catch (err) {
    authError.textContent = err.message;
  } finally {
    authSubmit.disabled = false;
  }
});

async function logoutSeller() {
  const auth = getSellerAuth();
  if (auth) {
    fetch("/api/sellers/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${auth.token}` }
    }).catch(() => {});
  }
  clearSellerAuth();
  refreshAccountUI();
}

/* ---------- Account management (profile, PIN, delete account) ---------- */

async function openAccountModal() {
  const auth = getSellerAuth();
  if (!auth) return;

  profileMsg.textContent = "";
  pinMsg.textContent = "";
  deleteMsg.textContent = "";
  pinForm.reset();
  accountPhone.textContent = `Numéro : ${auth.maskedPhone}`;
  storeNameInput.value = auth.storeName || "";
  accountModal.hidden = false;

  try {
    const res = await fetch("/api/sellers/me", { headers: { Authorization: `Bearer ${auth.token}` } });
    if (res.status === 401) {
      clearSellerAuth();
      refreshAccountUI();
      closeAccountModal();
      openAuthModal("login");
      return;
    }
    const data = await res.json();
    if (res.ok) {
      storeNameInput.value = data.storeName || "";
      accountPhone.textContent = `Numéro : ${data.maskedPhone}`;
      setSellerAuth({ ...auth, storeName: data.storeName || "" });
      refreshAccountUI();
    }
  } catch {
    /* keep the cached values from localStorage if the profile refresh fails */
  }
}
function closeAccountModal() {
  accountModal.hidden = true;
}

manageAccountBtn.addEventListener("click", openAccountModal);
accountClose.addEventListener("click", closeAccountModal);
accountModal.addEventListener("click", (e) => {
  if (e.target === accountModal) closeAccountModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !accountModal.hidden) closeAccountModal();
});

logoutFromAccountBtn.addEventListener("click", () => {
  closeAccountModal();
  logoutSeller();
});

profileForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const auth = getSellerAuth();
  if (!auth) return;

  profileMsg.textContent = "";
  profileMsg.className = "account-msg";
  profileSubmit.disabled = true;

  try {
    const res = await fetch("/api/sellers/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
      body: JSON.stringify({ storeName: storeNameInput.value.trim() })
    });
    const data = await res.json();
    if (res.status === 401) {
      clearSellerAuth();
      refreshAccountUI();
      closeAccountModal();
      throw new Error("Votre session a expiré — veuillez vous reconnecter.");
    }
    if (!res.ok) throw new Error(data.error || "Une erreur s'est produite.");

    setSellerAuth({ ...auth, storeName: data.storeName || "" });
    refreshAccountUI();
    profileMsg.textContent = "Profil mis à jour.";
    profileMsg.className = "account-msg ok";
    refreshFeed();
  } catch (err) {
    profileMsg.textContent = err.message;
    profileMsg.className = "account-msg error";
  } finally {
    profileSubmit.disabled = false;
  }
});

pinForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const auth = getSellerAuth();
  if (!auth) return;

  pinMsg.textContent = "";
  pinMsg.className = "account-msg";
  pinSubmit.disabled = true;

  try {
    const res = await fetch("/api/sellers/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
      body: JSON.stringify({ currentPin: currentPinInput.value.trim(), newPin: newPinInput.value.trim() })
    });
    const data = await res.json();
    if (res.status === 401) {
      clearSellerAuth();
      refreshAccountUI();
      closeAccountModal();
      throw new Error("Votre session a expiré — veuillez vous reconnecter.");
    }
    if (!res.ok) throw new Error(data.error || "Une erreur s'est produite.");

    pinForm.reset();
    pinMsg.textContent = "Code PIN mis à jour.";
    pinMsg.className = "account-msg ok";
  } catch (err) {
    pinMsg.textContent = err.message;
    pinMsg.className = "account-msg error";
  } finally {
    pinSubmit.disabled = false;
  }
});

deleteAccountBtn.addEventListener("click", async () => {
  const auth = getSellerAuth();
  if (!auth) return;
  if (!window.confirm("Supprimer définitivement votre compte et toutes vos annonces ? Cette action est irréversible.")) return;

  deleteMsg.textContent = "";
  deleteAccountBtn.disabled = true;

  try {
    const res = await fetch("/api/sellers/me", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${auth.token}` }
    });
    if (!res.ok && res.status !== 401) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Une erreur s'est produite.");
    }

    clearSellerAuth();
    refreshAccountUI();
    closeAccountModal();
    refreshFeed();
  } catch (err) {
    deleteMsg.textContent = err.message;
    deleteMsg.className = "account-msg error";
  } finally {
    deleteAccountBtn.disabled = false;
  }
});

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "à l'instant";
  const m = Math.floor(s / 60);
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h} h`;
  return `il y a ${Math.floor(h / 24)} j`;
}

function renderProducts(products, highlightId = null, mine = false) {
  grid.innerHTML = "";
  countBadge.textContent = products.length;
  emptyState.hidden = products.length > 0;
  productsCache = new Map(products.map((p) => [p.id, p]));

  for (const p of products) {
    const card = document.createElement("article");
    card.className = "card" + (p.id === highlightId ? " card-new" : "");
    card.innerHTML = `
      <div class="photo-wrap">
        <img class="photo" src="${p.imageUrl}" alt="${escapeHtml(p.name)}" loading="lazy" />
        <span class="vendor-tag">${escapeHtml(p.vendorId)}</span>
      </div>
      <div class="stub">
        <p class="pname">${escapeHtml(p.name)}</p>
        <p class="pdesc">${escapeHtml(p.description)}</p>
        ${
          mine
            ? ""
            : `<button type="button" class="vendor-line" data-phone="${escapeHtml(p.sellerPhone || "")}" data-label="${escapeHtml(p.storeName || p.vendorId)}">
                 🏪 ${escapeHtml(p.storeName || p.vendorId)}${p.storeName ? ` · ${escapeHtml(p.ownerLabel || p.vendorId)}` : ""}
               </button>`
        }
        <div class="card-actions">
          ${
            mine
              ? `<button type="button" class="icon-btn edit-btn" data-id="${p.id}">✏️ Modifier</button>
                 <button type="button" class="icon-btn delete-btn" data-id="${p.id}">🗑️ Supprimer</button>`
              : `<button type="button" class="icon-btn chat-btn" data-id="${p.id}" data-name="${escapeHtml(p.name)}" data-vendor="${escapeHtml(p.vendorId)}" data-phone="${escapeHtml(p.contact || "")}">
                   💬 Discuter avec le vendeur
                 </button>
                 ${
                   p.contact
                     ? `<a class="icon-btn whatsapp-btn" target="_blank" rel="noopener"
                          href="https://wa.me/${digitsOnly(p.contact)}?text=${encodeURIComponent("Bonjour ! Je suis intéressé(e) par " + p.name + " sur Snapy.")}">
                          🟢 WhatsApp
                        </a>`
                     : ""
                 }`
          }
        </div>
        <span class="ptime">${timeAgo(p.createdAt)}</span>
      </div>
    `;
    grid.appendChild(card);
  }
}

function escapeHtml(str = "") {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function digitsOnly(str = "") {
  return str.replace(/[^\d]/g, "");
}

function showSkeletonCard() {
  const card = document.createElement("article");
  card.className = "card skeleton";
  card.id = "skeletonCard";
  card.innerHTML = `
    <div class="photo-wrap"></div>
    <div class="stub">
      <div class="stub-line w60" style="height:13px;"></div>
      <div class="stub-line w90"></div>
      <div class="stub-line w60"></div>
      <span class="stub-caption">Claude rédige votre annonce…</span>
    </div>
  `;
  emptyState.hidden = true;
  grid.prepend(card);
}
function removeSkeletonCard() {
  document.getElementById("skeletonCard")?.remove();
}

async function refreshFeed(highlightId = null) {
  const auth = getSellerAuth();
  const mine = currentView === "mine";
  if (mine && !auth) {
    switchView("all");
    return;
  }

  const params = new URLSearchParams();
  if (currentView === "top") params.set("sort", "top");
  if (currentView === "boutique" && activeBoutiquePhone) params.set("seller", activeBoutiquePhone);
  if (currentView === "categoryFiltered" && activeCategory) params.set("category", activeCategory);

  try {
    const url = mine ? "/api/products/mine" : `/api/products${params.toString() ? "?" + params : ""}`;
    const res = await fetch(url, {
      headers: mine ? { Authorization: `Bearer ${auth.token}` } : {}
    });
    if (res.status === 401 && mine) {
      clearSellerAuth();
      refreshAccountUI();
      switchView("all");
      return;
    }
    const products = await res.json();
    renderProducts(products, highlightId, mine);
  } catch (err) {
    statusLine.textContent = "Impossible de charger les annonces. Le serveur est-il actif ?";
    statusLine.className = "status error";
  }
}

function setActiveNav(view) {
  for (const btn of mainNav.querySelectorAll(".nav-link")) {
    btn.classList.toggle("active", btn.dataset.view === view);
  }
}

async function loadCategoryTiles() {
  categoryGrid.innerHTML = "";
  try {
    const cats = categoriesCache.length ? categoriesCache : await fetchCategories();
    categoryGrid.innerHTML = cats
      .map(
        (c) => `
        <button type="button" class="category-tile" data-category="${escapeHtml(c.name)}">
          <span class="cat-name">${escapeHtml(c.name)}</span>
          <span class="cat-count">${c.count} annonce${c.count === 1 ? "" : "s"}</span>
        </button>`
      )
      .join("");
  } catch {
    categoryGrid.innerHTML = `<p class="empty-inline">Impossible de charger les catégories.</p>`;
  }
}

function switchView(view, highlightId = null) {
  currentView = view;
  activeBoutiquePhone = null;
  activeCategory = null;
  feedBack.hidden = true;
  setActiveNav(view);

  if (view === "categories") {
    feedTitle.textContent = "Catégories";
    grid.hidden = true;
    emptyState.hidden = true;
    countBadge.hidden = true;
    categoryGrid.hidden = false;
    loadCategoryTiles();
    return;
  }

  grid.hidden = false;
  countBadge.hidden = false;
  categoryGrid.hidden = true;

  if (view === "top") {
    feedTitle.textContent = "Top annonces";
    emptyText.textContent = "Pas encore assez d'activité pour établir un classement.";
  } else if (view === "mine") {
    feedTitle.textContent = "Mes annonces";
    emptyText.textContent = "Vous n'avez encore publié aucune annonce.";
  } else {
    feedTitle.textContent = "Nouvelles annonces";
    emptyText.textContent = "Aucun produit pour l'instant — soyez le premier à en publier un.";
  }
  refreshFeed(highlightId);
}

function openBoutique(phone, label) {
  if (!phone) return;
  currentView = "boutique";
  activeBoutiquePhone = phone;
  activeBoutiqueLabel = label;
  activeCategory = null;
  setActiveNav(null);
  grid.hidden = false;
  categoryGrid.hidden = true;
  countBadge.hidden = false;
  feedBack.hidden = false;
  feedTitle.textContent = `🏪 ${label}`;
  emptyText.textContent = "Cette boutique n'a pas encore publié d'annonce.";
  refreshFeed();
}

function openCategoryProducts(name) {
  currentView = "categoryFiltered";
  activeCategory = name;
  activeBoutiquePhone = null;
  setActiveNav(null);
  grid.hidden = false;
  categoryGrid.hidden = true;
  countBadge.hidden = false;
  feedBack.hidden = false;
  feedTitle.textContent = `Catégorie : ${name}`;
  emptyText.textContent = "Aucune annonce dans cette catégorie pour l'instant.";
  refreshFeed();
}

feedBack.addEventListener("click", () => switchView(currentView === "categoryFiltered" ? "categories" : "all"));

navAnnonces.addEventListener("click", () => switchView("all"));
navTop.addEventListener("click", () => switchView("top"));
navCategories.addEventListener("click", () => switchView("categories"));
navMyAds.addEventListener("click", () => {
  if (!getSellerAuth()) {
    openAuthModal("login");
    return;
  }
  switchView("mine");
});

categoryGrid.addEventListener("click", (e) => {
  const tile = e.target.closest(".category-tile");
  if (tile) openCategoryProducts(tile.dataset.category);
});

/* ---------- Categories (shared by composer select, edit select, and nav) ---------- */

async function fetchCategories() {
  const res = await fetch("/api/categories");
  const cats = await res.json();
  categoriesCache = cats;
  return cats;
}

async function populateCategorySelects() {
  try {
    const cats = await fetchCategories();
    const options = cats.map((c) => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)}</option>`).join("");
    categoryInput.innerHTML = '<option value="" disabled selected>Choisissez une catégorie</option>' + options;
    editCategoryInput.innerHTML = '<option value="" disabled>Choisissez une catégorie</option>' + options;
  } catch {
    /* leave the placeholder option if categories can't be loaded */
  }
}

function setPreviewFromFile(file) {
  if (!file) return;
  preview.src = URL.createObjectURL(file);
  preview.hidden = false;
  dropzoneInner.hidden = true;
  retakeBtn.hidden = false;
  dropzone.classList.add("has-image");
}

function clearPreview() {
  preview.hidden = true;
  preview.src = "";
  dropzoneInner.hidden = false;
  retakeBtn.hidden = true;
  dropzone.classList.remove("has-image");
  photoInput.value = "";
  captureInput.value = "";
}

photoInput.addEventListener("change", () => setPreviewFromFile(photoInput.files[0]));
captureInput.addEventListener("change", () => setPreviewFromFile(captureInput.files[0]));

retakeBtn.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  clearPreview();
});

["dragover", "dragleave", "drop"].forEach((evt) => {
  dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    dropzone.classList.toggle("drag", evt === "dragover");
  });
});
dropzone.addEventListener("drop", (e) => {
  const file = e.dataTransfer.files[0];
  if (file) {
    photoInput.files = e.dataTransfer.files;
    photoInput.dispatchEvent(new Event("change"));
  }
});

/* ---------- Live camera capture ---------- */

async function openCamera() {
  cameraModal.hidden = false;
  cameraError.hidden = true;
  cameraVideo.hidden = false;
  try {
    currentStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode },
      audio: false
    });
    cameraVideo.srcObject = currentStream;
  } catch (err) {
    cameraVideo.hidden = true;
    cameraError.hidden = false;
    cameraError.textContent =
      "Impossible d'accéder à votre caméra (permission refusée ou indisponible). Fermez ceci et utilisez la zone d'importation à la place.";
  }
}

function closeCamera() {
  if (currentStream) {
    currentStream.getTracks().forEach((t) => t.stop());
    currentStream = null;
  }
  cameraModal.hidden = true;
}

cameraBtn.addEventListener("click", async () => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    // No live camera API support (older browser) — fall back to native capture input.
    captureInput.click();
    return;
  }
  openCamera();
});

cameraClose.addEventListener("click", closeCamera);

cameraSwitch.addEventListener("click", async () => {
  facingMode = facingMode === "environment" ? "user" : "environment";
  if (currentStream) currentStream.getTracks().forEach((t) => t.stop());
  await openCamera();
});

cameraShutter.addEventListener("click", () => {
  const w = cameraVideo.videoWidth;
  const h = cameraVideo.videoHeight;
  if (!w || !h) return;

  cameraCanvas.width = w;
  cameraCanvas.height = h;
  const ctx = cameraCanvas.getContext("2d");
  ctx.drawImage(cameraVideo, 0, 0, w, h);

  cameraCanvas.toBlob(
    (blob) => {
      const file = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" });
      const dt = new DataTransfer();
      dt.items.add(file);
      photoInput.files = dt.files;
      setPreviewFromFile(file);
      closeCamera();
    },
    "image/jpeg",
    0.92
  );
});

cameraModal.addEventListener("click", (e) => {
  if (e.target === cameraModal) closeCamera();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !cameraModal.hidden) closeCamera();
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  statusLine.textContent = "";
  statusLine.className = "status";

  if (!photoInput.files[0]) {
    statusLine.textContent = "Ajoutez d'abord une photo du produit.";
    statusLine.className = "status error";
    return;
  }
  if (!categoryInput.value) {
    statusLine.textContent = "Choisissez une catégorie pour votre produit.";
    statusLine.className = "status error";
    return;
  }

  const auth = getSellerAuth();
  if (!auth) {
    statusLine.textContent = "Veuillez vous connecter pour publier un produit.";
    statusLine.className = "status error";
    openAuthModal("login");
    return;
  }

  const fd = new FormData();
  fd.append("image", photoInput.files[0]);
  fd.append("name", nameInput.value.trim());
  fd.append("category", categoryInput.value);

  postBtn.disabled = true;
  postBtnLabel.textContent = "Claude examine la photo…";
  statusLine.textContent = "Génération d'une description façon Twitter à partir de votre photo…";
  statusLine.className = "status loading";
  showSkeletonCard();

  try {
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { Authorization: `Bearer ${auth.token}` },
      body: fd
    });
    const data = await res.json();

    if (res.status === 401) {
      clearSellerAuth();
      refreshAccountUI();
      throw new Error("Votre session a expiré — veuillez vous reconnecter.");
    }
    if (!res.ok) throw new Error(data.error || "Une erreur s'est produite.");

    statusLine.textContent = "Publié → " + data.description;
    statusLine.className = "status ok";

    nameInput.value = "";
    categoryInput.value = "";
    clearPreview();

    switchView("all", data.id);
    if (categoriesCache.length) loadCategoryTiles();
  } catch (err) {
    statusLine.textContent = err.message;
    statusLine.className = "status error";
  } finally {
    removeSkeletonCard();
    postBtn.disabled = false;
    postBtnLabel.textContent = "Publier le produit";
  }
});

refreshAccountUI();
populateCategorySelects();
switchView("all");

/* ---------- Chat ---------- */

const chatModal = document.getElementById("chatModal");
const chatClose = document.getElementById("chatClose");
const chatVendor = document.getElementById("chatVendor");
const chatProductName = document.getElementById("chatProductName");
const chatMessages = document.getElementById("chatMessages");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");

let activeChatProductId = null;
let activeChatVendorId = null;
let chatPollTimer = null;

function renderMessages(messages) {
  const myId = getMySenderId();
  chatMessages.innerHTML = messages
    .map((m) => {
      const mine = m.senderId === myId;
      return `
        <div class="msg ${mine ? "mine" : "theirs"}">
          <span class="msg-bubble">${escapeHtml(m.text)}</span>
          <span class="msg-meta">${mine ? "Vous" : m.role === "seller" ? "Vendeur" : m.senderId} · ${timeAgo(m.createdAt)}</span>
        </div>`;
    })
    .join("");
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function fetchChat(productId) {
  try {
    const res = await fetch(`/api/chats/${productId}`);
    if (!res.ok) return;
    const data = await res.json();
    if (activeChatProductId === productId) renderMessages(data.messages);
  } catch {
    /* silent — polling, no need to surface transient errors */
  }
}

function openChat(productId, productName, vendorLabel, sellerPhone) {
  activeChatProductId = productId;
  activeChatVendorId = vendorLabel;
  chatProductName.textContent = productName;

  const myId = getMySenderId();
  chatVendor.textContent = myId === sellerPhone ? "Vous discutez en tant que vendeur" : vendorLabel;

  chatMessages.innerHTML = "";
  chatModal.hidden = false;
  chatInput.value = "";
  chatInput.focus();

  fetchChat(productId);
  clearInterval(chatPollTimer);
  chatPollTimer = setInterval(() => fetchChat(productId), 2500);
}

function closeChat() {
  chatModal.hidden = true;
  clearInterval(chatPollTimer);
  activeChatProductId = null;
}

grid.addEventListener("click", (e) => {
  const chatBtn = e.target.closest(".chat-btn");
  if (chatBtn) {
    openChat(chatBtn.dataset.id, chatBtn.dataset.name, chatBtn.dataset.vendor, chatBtn.dataset.phone);
    return;
  }
  const editBtn = e.target.closest(".edit-btn");
  if (editBtn) {
    openEditModal(editBtn.dataset.id);
    return;
  }
  const deleteBtn = e.target.closest(".delete-btn");
  if (deleteBtn) {
    deleteProduct(deleteBtn.dataset.id);
    return;
  }
  const vendorLink = e.target.closest(".vendor-line");
  if (vendorLink) {
    openBoutique(vendorLink.dataset.phone, vendorLink.dataset.label);
  }
});

/* ---------- Edit / delete own products ---------- */

function openEditModal(id) {
  const product = productsCache.get(id);
  if (!product) return;

  editingProductId = id;
  editMsg.textContent = "";
  editNameInput.value = product.name;
  editCategoryInput.value = product.category || "";
  editPreview.src = product.imageUrl;
  editPhotoInput.value = "";
  editModal.hidden = false;
}
function closeEditModal() {
  editModal.hidden = true;
  editingProductId = null;
}

editClose.addEventListener("click", closeEditModal);
editModal.addEventListener("click", (e) => {
  if (e.target === editModal) closeEditModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !editModal.hidden) closeEditModal();
});

editPhotoInput.addEventListener("change", () => {
  const file = editPhotoInput.files[0];
  if (file) editPreview.src = URL.createObjectURL(file);
});

editForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const auth = getSellerAuth();
  if (!auth || !editingProductId) return;

  editMsg.textContent = "";
  editSubmit.disabled = true;
  const originalLabel = editSubmit.textContent;
  editSubmit.textContent = "Enregistrement…";

  const fd = new FormData();
  fd.append("name", editNameInput.value.trim());
  fd.append("category", editCategoryInput.value);
  if (editPhotoInput.files[0]) fd.append("image", editPhotoInput.files[0]);

  try {
    const res = await fetch(`/api/products/${editingProductId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${auth.token}` },
      body: fd
    });
    const data = await res.json();

    if (res.status === 401) {
      clearSellerAuth();
      refreshAccountUI();
      throw new Error("Votre session a expiré — veuillez vous reconnecter.");
    }
    if (!res.ok) throw new Error(data.error || "Une erreur s'est produite.");

    closeEditModal();
    await refreshFeed();
  } catch (err) {
    editMsg.textContent = err.message;
    editMsg.className = "edit-msg error";
  } finally {
    editSubmit.disabled = false;
    editSubmit.textContent = originalLabel;
  }
});

async function deleteProduct(id) {
  const auth = getSellerAuth();
  if (!auth) return;
  if (!window.confirm("Supprimer définitivement cette annonce ?")) return;

  try {
    const res = await fetch(`/api/products/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${auth.token}` }
    });
    if (res.status === 401) {
      clearSellerAuth();
      refreshAccountUI();
      return;
    }
    if (res.ok || res.status === 404) await refreshFeed();
  } catch {
    /* leave the list as-is; the user can retry */
  }
}

chatClose.addEventListener("click", closeChat);
chatModal.addEventListener("click", (e) => {
  if (e.target === chatModal) closeChat();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !chatModal.hidden) closeChat();
});

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text || !activeChatProductId) return;

  chatInput.value = "";
  try {
    const res = await fetch(`/api/chats/${activeChatProductId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senderId: getMySenderId(), text })
    });
    if (res.ok) fetchChat(activeChatProductId);
  } catch {
    /* if it fails, the message just won't appear — user can retry */
  }
});
