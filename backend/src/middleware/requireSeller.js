import { verifySellerToken } from "../lib/jwt.js";

export function requireSeller(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  const phone = token && verifySellerToken(token);
  if (!phone) {
    return res.status(401).json({ error: "Veuillez vous connecter avec votre compte vendeur." });
  }
  req.sellerPhone = phone;
  next();
}
