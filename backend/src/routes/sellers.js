import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "../db.js";
import { requireSeller } from "../middleware/requireSeller.js";
import { signSellerToken } from "../lib/jwt.js";
import { deleteUploadedFile } from "../lib/upload.js";
import { normalizePhone, maskPhone, isValidPhone, isValidPin } from "../lib/helpers.js";

export const sellersRouter = Router();

const getSellerByPhone = db.prepare("SELECT * FROM sellers WHERE phone = ?");
const insertSeller = db.prepare(
  "INSERT INTO sellers (phone, pin_hash, store_name, created_at) VALUES (@phone, @pin_hash, @store_name, @created_at)"
);
const updateStoreName = db.prepare("UPDATE sellers SET store_name = ? WHERE phone = ?");
const updatePinHash = db.prepare("UPDATE sellers SET pin_hash = ? WHERE phone = ?");
const deleteSeller = db.prepare("DELETE FROM sellers WHERE phone = ?");
const productsBySeller = db.prepare("SELECT * FROM products WHERE seller_phone = ?");

sellersRouter.post("/register", (req, res) => {
  const phone = normalizePhone(req.body.phone);
  const { pin } = req.body;
  const storeName = (req.body.storeName || "").trim().slice(0, 40);

  if (!isValidPhone(phone)) return res.status(400).json({ error: "Saisissez un numéro de téléphone valide." });
  if (!isValidPin(pin)) return res.status(400).json({ error: "Le code PIN doit comporter 4 à 6 chiffres." });
  if (getSellerByPhone.get(phone)) {
    return res.status(409).json({ error: "Ce numéro de téléphone est déjà enregistré. Essayez de vous connecter." });
  }

  insertSeller.run({
    phone,
    pin_hash: bcrypt.hashSync(pin, 10),
    store_name: storeName,
    created_at: Date.now()
  });

  const token = signSellerToken(phone);
  res.status(201).json({ token, phone, maskedPhone: maskPhone(phone), storeName });
});

sellersRouter.post("/login", (req, res) => {
  const phone = normalizePhone(req.body.phone);
  const { pin } = req.body;

  const seller = getSellerByPhone.get(phone);
  if (!seller) return res.status(404).json({ error: "Aucun compte vendeur trouvé pour ce numéro de téléphone." });
  if (!bcrypt.compareSync(pin || "", seller.pin_hash)) {
    return res.status(401).json({ error: "Code PIN incorrect." });
  }

  const token = signSellerToken(phone);
  res.json({ token, phone, maskedPhone: maskPhone(phone), storeName: seller.store_name || "" });
});

// Logout is a client-side no-op with JWTs (the token simply expires / gets discarded).
sellersRouter.post("/logout", (_req, res) => {
  res.status(204).end();
});

sellersRouter.get("/me", requireSeller, (req, res) => {
  const seller = getSellerByPhone.get(req.sellerPhone);
  if (!seller) return res.status(404).json({ error: "Compte introuvable." });

  res.json({
    phone: seller.phone,
    maskedPhone: maskPhone(seller.phone),
    storeName: seller.store_name || "",
    createdAt: seller.created_at
  });
});

sellersRouter.patch("/me", requireSeller, (req, res) => {
  const seller = getSellerByPhone.get(req.sellerPhone);
  if (!seller) return res.status(404).json({ error: "Compte introuvable." });

  const { storeName, currentPin, newPin } = req.body;

  if (storeName !== undefined) {
    const trimmed = storeName.trim();
    if (trimmed.length > 40) return res.status(400).json({ error: "Le nom de la boutique est trop long (40 caractères max)." });
    updateStoreName.run(trimmed, seller.phone);
    seller.store_name = trimmed;
  }

  if (newPin !== undefined) {
    if (!bcrypt.compareSync(currentPin || "", seller.pin_hash)) {
      return res.status(403).json({ error: "Code PIN actuel incorrect." });
    }
    if (!isValidPin(newPin)) return res.status(400).json({ error: "Le nouveau code PIN doit comporter 4 à 6 chiffres." });
    updatePinHash.run(bcrypt.hashSync(newPin, 10), seller.phone);
  }

  res.json({ phone: seller.phone, maskedPhone: maskPhone(seller.phone), storeName: seller.store_name || "" });
});

sellersRouter.delete("/me", requireSeller, (req, res) => {
  const phone = req.sellerPhone;
  const owned = productsBySeller.all(phone);
  for (const p of owned) deleteUploadedFile(p.image_url);

  // ON DELETE CASCADE removes the seller's products and their chat messages.
  deleteSeller.run(phone);
  res.status(204).end();
});
