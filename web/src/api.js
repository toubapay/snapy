const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

class ApiError extends Error {
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

export { ApiError };
