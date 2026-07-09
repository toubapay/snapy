import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET;
if (!SECRET) {
  throw new Error("JWT_SECRET is not set — copy .env.example to .env and set a random secret.");
}

const EXPIRES_IN = "30d";

export function signSellerToken(phone) {
  return jwt.sign({ phone }, SECRET, { expiresIn: EXPIRES_IN });
}

export function verifySellerToken(token) {
  try {
    const payload = jwt.verify(token, SECRET);
    return payload.phone;
  } catch {
    return null;
  }
}
