import "dotenv/config";
import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";
import Anthropic from "@anthropic-ai/sdk";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const UPLOADS_DIR = path.join(__dirname, "uploads");
const DATA_FILE = path.join(__dirname, "data", "products.json");
const CHATS_FILE = path.join(__dirname, "data", "chats.json");
const SELLERS_FILE = path.join(__dirname, "data", "sellers.json");

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "[]");
if (!fs.existsSync(CHATS_FILE)) fs.writeFileSync(CHATS_FILE, "{}");
if (!fs.existsSync(SELLERS_FILE)) fs.writeFileSync(SELLERS_FILE, "[]");

// In-memory session tokens (token -> phone). Reset on server restart, which
// is fine for this demo — the frontend just prompts to log in again.
const sessions = new Map();

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const app = express();
app.use(express.json());
app.use("/uploads", express.static(UPLOADS_DIR));
app.use(express.static(path.join(__dirname, "public")));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `${nanoid(10)}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Seuls les fichiers image sont autorisés"));
    }
    cb(null, true);
  }
});

function readProducts() {
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
}
function writeProducts(products) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(products, null, 2));
}

function readChats() {
  return JSON.parse(fs.readFileSync(CHATS_FILE, "utf-8"));
}
function writeChats(chats) {
  fs.writeFileSync(CHATS_FILE, JSON.stringify(chats, null, 2));
}

function readSellers() {
  return JSON.parse(fs.readFileSync(SELLERS_FILE, "utf-8"));
}
function writeSellers(sellers) {
  fs.writeFileSync(SELLERS_FILE, JSON.stringify(sellers, null, 2));
}

function normalizePhone(raw) {
  return (raw || "").replace(/[^\d]/g, "");
}
function maskPhone(phone) {
  return `•• ${phone.slice(-4)}`;
}
function isValidPhone(phone) {
  return phone.length >= 8 && phone.length <= 15;
}
function isValidPin(pin) {
  return /^\d{4,6}$/.test(pin || "");
}

function vendorLabelFor(seller) {
  return (seller?.storeName || "").trim() || `Vendeur ${maskPhone(seller.phone)}`;
}

function deleteUploadedFile(imageUrl) {
  if (!imageUrl) return;
  fs.unlink(path.join(UPLOADS_DIR, path.basename(imageUrl)), () => {});
}

const CATEGORIES = ["Mode", "Électronique", "Maison & Jardin", "Véhicules", "Loisirs & Bébé", "Autres"];
function normalizeCategory(category) {
  return CATEGORIES.includes(category) ? category : "Autres";
}

// Joins products with live seller data so boutique name / owner label always
// reflect the seller's current profile, even for listings posted before a
// storeName was set (products.json only persists the sellerPhone + category).
function enrichProducts(products) {
  const sellers = readSellers();
  const byPhone = new Map(sellers.map((s) => [s.phone, s]));
  return products.map((p) => {
    const seller = byPhone.get(p.sellerPhone);
    return {
      ...p,
      category: normalizeCategory(p.category),
      storeName: seller?.storeName || "",
      ownerLabel: `Vendeur ${maskPhone(p.sellerPhone)}`
    };
  });
}

function requireSeller(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  const phone = token && sessions.get(token);
  if (!phone) {
    return res.status(401).json({ error: "Veuillez vous connecter avec votre compte vendeur pour publier un produit." });
  }
  req.sellerPhone = phone;
  next();
}

// Map file extensions to media types Claude's vision API accepts
function mediaTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return { ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif" }[ext] || "image/jpeg";
}

async function generateTweetDescription(imagePath, productName) {
  const imageBase64 = fs.readFileSync(imagePath, { encoding: "base64" });
  const mediaType = mediaTypeFor(imagePath);

  const message = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 150,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: imageBase64 }
          },
          {
            type: "text",
            text: `Regarde cette photo de produit. Nom du produit : "${productName}".
Rédige UNE annonce façon Twitter, en français : percutante, texte brut, moins de 220 caractères, sans markdown, sans guillemets. Tu peux ajouter jusqu'à 2 hashtags pertinents à la fin. Adopte le ton d'un vendeur enthousiaste, pas d'un script publicitaire. Réponds UNIQUEMENT avec le texte de l'annonce, rien d'autre.`
          }
        ]
      }
    ]
  });

  const text = message.content.find((b) => b.type === "text")?.text || "";
  return text.trim();
}

app.post("/api/sellers/register", (req, res) => {
  const phone = normalizePhone(req.body.phone);
  const { pin } = req.body;
  const storeName = (req.body.storeName || "").trim().slice(0, 40);

  if (!isValidPhone(phone)) return res.status(400).json({ error: "Saisissez un numéro de téléphone valide." });
  if (!isValidPin(pin)) return res.status(400).json({ error: "Le code PIN doit comporter 4 à 6 chiffres." });

  const sellers = readSellers();
  if (sellers.some((s) => s.phone === phone)) {
    return res.status(409).json({ error: "Ce numéro de téléphone est déjà enregistré. Essayez de vous connecter." });
  }

  const seller = { phone, pinHash: bcrypt.hashSync(pin, 10), storeName, createdAt: Date.now() };
  sellers.push(seller);
  writeSellers(sellers);

  const token = nanoid(32);
  sessions.set(token, phone);
  res.status(201).json({ token, phone, maskedPhone: maskPhone(phone), storeName });
});

app.post("/api/sellers/login", (req, res) => {
  const phone = normalizePhone(req.body.phone);
  const { pin } = req.body;

  const sellers = readSellers();
  const seller = sellers.find((s) => s.phone === phone);
  if (!seller) return res.status(404).json({ error: "Aucun compte vendeur trouvé pour ce numéro de téléphone." });
  if (!bcrypt.compareSync(pin || "", seller.pinHash)) {
    return res.status(401).json({ error: "Code PIN incorrect." });
  }

  const token = nanoid(32);
  sessions.set(token, phone);
  res.json({ token, phone, maskedPhone: maskPhone(phone), storeName: seller.storeName || "" });
});

app.post("/api/sellers/logout", (req, res) => {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (token) sessions.delete(token);
  res.status(204).end();
});

app.get("/api/sellers/me", requireSeller, (req, res) => {
  const sellers = readSellers();
  const seller = sellers.find((s) => s.phone === req.sellerPhone);
  if (!seller) return res.status(404).json({ error: "Compte introuvable." });

  res.json({
    phone: seller.phone,
    maskedPhone: maskPhone(seller.phone),
    storeName: seller.storeName || "",
    createdAt: seller.createdAt
  });
});

app.patch("/api/sellers/me", requireSeller, (req, res) => {
  const sellers = readSellers();
  const seller = sellers.find((s) => s.phone === req.sellerPhone);
  if (!seller) return res.status(404).json({ error: "Compte introuvable." });

  const { storeName, currentPin, newPin } = req.body;

  if (storeName !== undefined) {
    const trimmed = storeName.trim();
    if (trimmed.length > 40) return res.status(400).json({ error: "Le nom de la boutique est trop long (40 caractères max)." });
    seller.storeName = trimmed;

    // Keep the vendor label shown on already-published listings in sync.
    const label = vendorLabelFor(seller);
    const products = readProducts();
    let touched = false;
    for (const p of products) {
      if (p.sellerPhone === seller.phone && p.vendorId !== label) {
        p.vendorId = label;
        touched = true;
      }
    }
    if (touched) writeProducts(products);
  }

  if (newPin !== undefined) {
    if (!bcrypt.compareSync(currentPin || "", seller.pinHash)) {
      return res.status(403).json({ error: "Code PIN actuel incorrect." });
    }
    if (!isValidPin(newPin)) return res.status(400).json({ error: "Le nouveau code PIN doit comporter 4 à 6 chiffres." });
    seller.pinHash = bcrypt.hashSync(newPin, 10);
  }

  writeSellers(sellers);
  res.json({ phone: seller.phone, maskedPhone: maskPhone(seller.phone), storeName: seller.storeName || "" });
});

app.delete("/api/sellers/me", requireSeller, (req, res) => {
  const phone = req.sellerPhone;

  const sellers = readSellers().filter((s) => s.phone !== phone);
  writeSellers(sellers);

  const products = readProducts();
  const owned = products.filter((p) => p.sellerPhone === phone);
  writeProducts(products.filter((p) => p.sellerPhone !== phone));

  const chats = readChats();
  for (const p of owned) {
    delete chats[p.id];
    deleteUploadedFile(p.imageUrl);
  }
  writeChats(chats);

  for (const [token, ph] of sessions) {
    if (ph === phone) sessions.delete(token);
  }

  res.status(204).end();
});

app.get("/api/products", (req, res) => {
  const { seller, category, sort } = req.query;
  let products = readProducts();

  if (seller) products = products.filter((p) => p.sellerPhone === seller);
  if (category) products = products.filter((p) => normalizeCategory(p.category) === category);

  if (sort === "top") {
    const chats = readChats();
    products = products.sort((a, b) => {
      const scoreDiff = (chats[b.id]?.length || 0) - (chats[a.id]?.length || 0);
      return scoreDiff !== 0 ? scoreDiff : b.createdAt - a.createdAt;
    });
  } else {
    products = products.sort((a, b) => b.createdAt - a.createdAt);
  }

  res.json(enrichProducts(products));
});

app.get("/api/products/mine", requireSeller, (req, res) => {
  const products = readProducts()
    .filter((p) => p.sellerPhone === req.sellerPhone)
    .sort((a, b) => b.createdAt - a.createdAt);
  res.json(enrichProducts(products));
});

app.get("/api/categories", (_req, res) => {
  const products = readProducts();
  const counts = new Map(CATEGORIES.map((name) => [name, 0]));
  for (const p of products) {
    const cat = normalizeCategory(p.category);
    counts.set(cat, counts.get(cat) + 1);
  }
  res.json(CATEGORIES.map((name) => ({ name, count: counts.get(name) })));
});

app.post("/api/products", requireSeller, upload.single("image"), async (req, res) => {
  try {
    const { name } = req.body;
    if (!req.file) return res.status(400).json({ error: "Une photo du produit est requise." });
    if (!name || !name.trim()) return res.status(400).json({ error: "Le nom du produit est requis." });

    let description;
    try {
      description = await generateTweetDescription(req.file.path, name.trim());
    } catch (err) {
      console.error("Claude generation failed:", err.message);
      description = "Nouvelle annonce en ligne — jetez un œil à la photo !";
    }

    const sellers = readSellers();
    const seller = sellers.find((s) => s.phone === req.sellerPhone);

    const product = {
      id: nanoid(12),
      name: name.trim(),
      category: normalizeCategory(req.body.category),
      imageUrl: `/uploads/${req.file.filename}`,
      description,
      vendorId: seller ? vendorLabelFor(seller) : `Vendeur ${maskPhone(req.sellerPhone)}`,
      sellerPhone: req.sellerPhone,
      contact: req.sellerPhone,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const products = readProducts();
    products.push(product);
    writeProducts(products);

    res.status(201).json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Une erreur s'est produite lors de la publication de votre produit." });
  }
});

app.patch("/api/products/:id", requireSeller, upload.single("image"), async (req, res) => {
  try {
    const { id } = req.params;
    const products = readProducts();
    const idx = products.findIndex((p) => p.id === id);
    if (idx === -1) return res.status(404).json({ error: "Produit introuvable." });

    const product = products[idx];
    if (product.sellerPhone !== req.sellerPhone) {
      return res.status(403).json({ error: "Vous ne pouvez modifier que vos propres produits." });
    }

    const { name, category } = req.body;
    let contentChanged = false;

    if (name !== undefined) {
      const trimmed = name.trim();
      if (!trimmed) return res.status(400).json({ error: "Le nom du produit est requis." });
      if (trimmed !== product.name) contentChanged = true;
      product.name = trimmed;
    }

    if (category !== undefined) {
      product.category = normalizeCategory(category);
    }

    const previousImageUrl = product.imageUrl;
    if (req.file) {
      product.imageUrl = `/uploads/${req.file.filename}`;
      contentChanged = true;
    }

    if (contentChanged) {
      try {
        const imagePath = req.file ? req.file.path : path.join(UPLOADS_DIR, path.basename(product.imageUrl));
        product.description = await generateTweetDescription(imagePath, product.name);
      } catch (err) {
        console.error("Claude regeneration failed:", err.message);
      }
    }

    product.updatedAt = Date.now();
    products[idx] = product;
    writeProducts(products);

    if (req.file && previousImageUrl !== product.imageUrl) deleteUploadedFile(previousImageUrl);

    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Une erreur s'est produite lors de la mise à jour du produit." });
  }
});

app.delete("/api/products/:id", requireSeller, (req, res) => {
  const { id } = req.params;
  const products = readProducts();
  const idx = products.findIndex((p) => p.id === id);
  if (idx === -1) return res.status(404).json({ error: "Produit introuvable." });

  const product = products[idx];
  if (product.sellerPhone !== req.sellerPhone) {
    return res.status(403).json({ error: "Vous ne pouvez supprimer que vos propres produits." });
  }

  products.splice(idx, 1);
  writeProducts(products);

  const chats = readChats();
  delete chats[id];
  writeChats(chats);

  deleteUploadedFile(product.imageUrl);

  res.status(204).end();
});

/**
 * Chat is one simple thread per product (demo-level — not per buyer/seller pair).
 * A logged-in seller sends messages using their phone as senderId; role is
 * derived by comparing that id against the product's sellerPhone.
 */
app.get("/api/chats/:productId", (req, res) => {
  const { productId } = req.params;
  const products = readProducts();
  const product = products.find((p) => p.id === productId);
  if (!product) return res.status(404).json({ error: "Produit introuvable." });

  const chats = readChats();
  res.json({
    productId,
    productName: product.name,
    sellerVendorId: product.vendorId,
    messages: chats[productId] || []
  });
});

app.post("/api/chats/:productId", (req, res) => {
  const { productId } = req.params;
  const { senderId, text } = req.body;

  const products = readProducts();
  const product = products.find((p) => p.id === productId);
  if (!product) return res.status(404).json({ error: "Produit introuvable." });

  const trimmed = (text || "").trim();
  if (!trimmed) return res.status(400).json({ error: "Le message ne peut pas être vide." });
  if (trimmed.length > 500) return res.status(400).json({ error: "Le message est trop long." });
  if (!senderId) return res.status(400).json({ error: "Identifiant d'expéditeur manquant." });

  const message = {
    id: nanoid(10),
    senderId,
    role: senderId === product.sellerPhone ? "seller" : "buyer",
    text: trimmed,
    createdAt: Date.now()
  };

  const chats = readChats();
  if (!chats[productId]) chats[productId] = [];
  chats[productId].push(message);
  writeChats(chats);

  res.status(201).json(message);
});

app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError || err.message?.includes("image")) {
    return res.status(400).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: "Erreur du serveur" });
});

app.listen(PORT, () => {
  console.log(`Snapy mini marketplace running → http://localhost:${PORT}`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("⚠️  ANTHROPIC_API_KEY is not set. Copy .env.example to .env and add your key.");
  }
});
