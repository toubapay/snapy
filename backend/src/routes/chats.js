import { Router } from "express";
import { nanoid } from "nanoid";
import { db } from "../db.js";
import { maskPhone } from "../lib/helpers.js";

export const chatsRouter = Router();

const getProductById = db.prepare("SELECT * FROM products WHERE id = ?");
const getSellerByPhone = db.prepare("SELECT * FROM sellers WHERE phone = ?");
const messagesForProduct = db.prepare("SELECT * FROM chat_messages WHERE product_id = ? ORDER BY created_at ASC");
const insertMessage = db.prepare(`
  INSERT INTO chat_messages (id, product_id, sender_id, role, text, created_at)
  VALUES (@id, @product_id, @sender_id, @role, @text, @created_at)
`);

function serializeMessage(row) {
  return {
    id: row.id,
    senderId: row.sender_id,
    role: row.role,
    text: row.text,
    createdAt: row.created_at
  };
}

chatsRouter.get("/:productId", (req, res) => {
  const { productId } = req.params;
  const product = getProductById.get(productId);
  if (!product) return res.status(404).json({ error: "Produit introuvable." });

  const seller = getSellerByPhone.get(product.seller_phone);
  const vendorLabel = (seller?.store_name || "").trim() || `Vendeur ${maskPhone(product.seller_phone)}`;

  res.json({
    productId,
    productName: product.name,
    sellerVendorId: vendorLabel,
    messages: messagesForProduct.all(productId).map(serializeMessage)
  });
});

chatsRouter.post("/:productId", (req, res) => {
  const { productId } = req.params;
  const { senderId, text } = req.body;

  const product = getProductById.get(productId);
  if (!product) return res.status(404).json({ error: "Produit introuvable." });

  const trimmed = (text || "").trim();
  if (!trimmed) return res.status(400).json({ error: "Le message ne peut pas être vide." });
  if (trimmed.length > 500) return res.status(400).json({ error: "Le message est trop long." });
  if (!senderId) return res.status(400).json({ error: "Identifiant d'expéditeur manquant." });

  const message = {
    id: nanoid(10),
    product_id: productId,
    sender_id: senderId,
    role: senderId === product.seller_phone ? "seller" : "buyer",
    text: trimmed,
    created_at: Date.now()
  };
  insertMessage.run(message);

  res.status(201).json(serializeMessage(message));
});
