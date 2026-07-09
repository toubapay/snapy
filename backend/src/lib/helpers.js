export const CATEGORIES = ["Mode", "Électronique", "Maison & Jardin", "Véhicules", "Loisirs & Bébé", "Autres"];

export function normalizeCategory(category) {
  return CATEGORIES.includes(category) ? category : "Autres";
}

export function normalizePhone(raw) {
  return (raw || "").replace(/[^\d]/g, "");
}
export function maskPhone(phone) {
  return `•• ${phone.slice(-4)}`;
}
export function isValidPhone(phone) {
  return phone.length >= 8 && phone.length <= 15;
}
export function isValidPin(pin) {
  return /^\d{4,6}$/.test(pin || "");
}
export function vendorLabelFor(seller) {
  return (seller?.store_name || "").trim() || `Vendeur ${maskPhone(seller.phone)}`;
}
