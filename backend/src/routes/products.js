import { Router } from "express";
import path from "path";
import { nanoid } from "nanoid";
import { db } from "../db.js";
import { requireSeller } from "../middleware/requireSeller.js";
import { upload, UPLOADS_DIR, deleteUploadedFile } from "../lib/upload.js";
import { generateTweetDescription } from "../lib/anthropic.js";
import { CATEGORIES, normalizeCategory, maskPhone } from "../lib/helpers.js";

export const productsRouter = Router();

const getSellerByPhone = db.prepare("SELECT * FROM sellers WHERE phone = ?");
const getProductById = db.prepare("SELECT * FROM products WHERE id = ?");
const insertProduct = db.prepare(`
  INSERT INTO products (id, name, category, image_url, audio_url, description, seller_phone, created_at, updated_at)
  VALUES (@id, @name, @category, @image_url, @audio_url, @description, @seller_phone, @created_at, @updated_at)
`);
const updateProductStmt = db.prepare(`
  UPDATE products SET name = @name, category = @category, image_url = @image_url,
    description = @description, updated_at = @updated_at
  WHERE id = @id
`);
const deleteProductStmt = db.prepare("DELETE FROM products WHERE id = ?");

const listRecent = db.prepare(`
  SELECT p.*, s.store_name AS seller_store_name
  FROM products p JOIN sellers s ON s.phone = p.seller_phone
  WHERE (@seller IS NULL OR p.seller_phone = @seller)
    AND (@category IS NULL OR p.category = @category)
  ORDER BY p.created_at DESC
`);
const listTop = db.prepare(`
  SELECT p.*, s.store_name AS seller_store_name, COALESCE(c.msg_count, 0) AS msg_count
  FROM products p
  JOIN sellers s ON s.phone = p.seller_phone
  LEFT JOIN (SELECT product_id, COUNT(*) AS msg_count FROM chat_messages GROUP BY product_id) c
    ON c.product_id = p.id
  WHERE (@seller IS NULL OR p.seller_phone = @seller)
    AND (@category IS NULL OR p.category = @category)
  ORDER BY msg_count DESC, p.created_at DESC
`);
const listMine = db.prepare(`
  SELECT p.*, s.store_name AS seller_store_name
  FROM products p JOIN sellers s ON s.phone = p.seller_phone
  WHERE p.seller_phone = ?
  ORDER BY p.created_at DESC
`);
const categoryCounts = db.prepare(`
  SELECT category, COUNT(*) AS count FROM products GROUP BY category
`);

function serializeProduct(row) {
  return {
    id: row.id,
    name: row.name,
    category: normalizeCategory(row.category),
    imageUrl: row.image_url,
    audioUrl: row.audio_url || null,
    description: row.description,
    vendorId: (row.seller_store_name || "").trim() || `Vendeur ${maskPhone(row.seller_phone)}`,
    storeName: row.seller_store_name || "",
    ownerLabel: `Vendeur ${maskPhone(row.seller_phone)}`,
    sellerPhone: row.seller_phone,
    contact: row.seller_phone,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

productsRouter.get("/", (req, res) => {
  const { seller, category, sort } = req.query;
  const params = { seller: seller || null, category: category || null };
  const rows = sort === "top" ? listTop.all(params) : listRecent.all(params);
  res.json(rows.map(serializeProduct));
});

productsRouter.get("/mine", requireSeller, (req, res) => {
  res.json(listMine.all(req.sellerPhone).map(serializeProduct));
});

productsRouter.post("/", requireSeller, upload.fields([{ name: "image", maxCount: 1 }, { name: "audio", maxCount: 1 }]), async (req, res) => {
  try {
    const { name } = req.body;
    const imageFile = req.files?.image?.[0];
    const audioFile = req.files?.audio?.[0];
    if (!imageFile) return res.status(400).json({ error: "Une photo du produit est requise." });
    if (!name || !name.trim()) return res.status(400).json({ error: "Le nom du produit est requis." });

    let description;
    try {
      description = await generateTweetDescription(imageFile.path, name.trim());
    } catch (err) {
      console.error("Claude generation failed:", err.message);
      description = "Nouvelle annonce en ligne — jetez un œil à la photo !";
    }

    const now = Date.now();
    const product = {
      id: nanoid(12),
      name: name.trim(),
      category: normalizeCategory(req.body.category),
      image_url: `/uploads/${imageFile.filename}`,
      audio_url: audioFile ? `/uploads/${audioFile.filename}` : null,
      description,
      seller_phone: req.sellerPhone,
      created_at: now,
      updated_at: now
    };
    insertProduct.run(product);

    const seller = getSellerByPhone.get(req.sellerPhone);
    res.status(201).json(serializeProduct({ ...product, seller_store_name: seller?.store_name || "" }));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Une erreur s'est produite lors de la publication de votre produit." });
  }
});

productsRouter.patch("/:id", requireSeller, upload.single("image"), async (req, res) => {
  try {
    const { id } = req.params;
    const product = getProductById.get(id);
    if (!product) return res.status(404).json({ error: "Produit introuvable." });
    if (product.seller_phone !== req.sellerPhone) {
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

    const previousImageUrl = product.image_url;
    if (req.file) {
      product.image_url = `/uploads/${req.file.filename}`;
      contentChanged = true;
    }

    if (contentChanged) {
      try {
        const imagePath = req.file ? req.file.path : path.join(UPLOADS_DIR, path.basename(product.image_url));
        product.description = await generateTweetDescription(imagePath, product.name);
      } catch (err) {
        console.error("Claude regeneration failed:", err.message);
      }
    }

    product.updated_at = Date.now();
    updateProductStmt.run(product);

    if (req.file && previousImageUrl !== product.image_url) deleteUploadedFile(previousImageUrl);

    const seller = getSellerByPhone.get(product.seller_phone);
    res.json(serializeProduct({ ...product, seller_store_name: seller?.store_name || "" }));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Une erreur s'est produite lors de la mise à jour du produit." });
  }
});

productsRouter.delete("/:id", requireSeller, (req, res) => {
  const { id } = req.params;
  const product = getProductById.get(id);
  if (!product) return res.status(404).json({ error: "Produit introuvable." });
  if (product.seller_phone !== req.sellerPhone) {
    return res.status(403).json({ error: "Vous ne pouvez supprimer que vos propres produits." });
  }

  deleteProductStmt.run(id); // ON DELETE CASCADE removes the product's chat messages too
  deleteUploadedFile(product.image_url);
  deleteUploadedFile(product.audio_url);
  res.status(204).end();
});

productsRouter.get("/categories", (_req, res) => {
  const counts = new Map(CATEGORIES.map((name) => [name, 0]));
  for (const row of categoryCounts.all()) {
    counts.set(normalizeCategory(row.category), (counts.get(normalizeCategory(row.category)) || 0) + row.count);
  }
  res.json(CATEGORIES.map((name) => ({ name, count: counts.get(name) })));
});
