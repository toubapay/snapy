import { Platform } from "react-native";

// Android emulator can't reach the host machine via "localhost" — it maps
// 10.0.2.2 to the host instead. iOS simulator and web share the host's
// localhost directly. Physical devices need the host's LAN IP, set via
// EXPO_PUBLIC_API_BASE_URL in .env (see backend startup log for the LAN URL).
const DEFAULT_BASE = Platform.OS === "android" ? "http://10.0.2.2:4000" : "http://localhost:4000";
const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || DEFAULT_BASE;

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = "GET", token, json, form } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (json !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: form ? form : json !== undefined ? JSON.stringify(json) : undefined
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error || "Une erreur s'est produite.", res.status);
  return data;
}

export const api = {
  base: API_BASE,

  register: (phone, pin, storeName) => request("/api/sellers/register", { method: "POST", json: { phone, pin, storeName } }),
  login: (phone, pin) => request("/api/sellers/login", { method: "POST", json: { phone, pin } }),
  logout: (token) => request("/api/sellers/logout", { method: "POST", token }),
  me: (token) => request("/api/sellers/me", { token }),
  updateProfile: (token, body) => request("/api/sellers/me", { method: "PATCH", token, json: body }),
  deleteAccount: (token) => request("/api/sellers/me", { method: "DELETE", token }),

  products: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/products${qs ? "?" + qs : ""}`);
  },
  myProducts: (token) => request("/api/products/mine", { token }),
  createProduct: (token, form) => request("/api/products", { method: "POST", token, form }),
  updateProduct: (token, id, form) => request(`/api/products/${id}`, { method: "PATCH", token, form }),
  deleteProduct: (token, id) => request(`/api/products/${id}`, { method: "DELETE", token }),
  categories: () => request("/api/products/categories"),

  chat: (productId) => request(`/api/chats/${productId}`),
  sendChat: (productId, senderId, text) => request(`/api/chats/${productId}`, { method: "POST", json: { senderId, text } })
};
