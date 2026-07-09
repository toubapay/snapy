import { useCallback, useState } from "react";

const STORAGE_KEY = "snapy_seller";
const BUYER_KEY = "snapy_buyer_id";

function readAuth() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  } catch {
    return null;
  }
}

export function getBuyerId() {
  let id = localStorage.getItem(BUYER_KEY);
  if (!id) {
    id = "Acheteur-" + Math.random().toString(36).slice(2, 6).toUpperCase();
    localStorage.setItem(BUYER_KEY, id);
  }
  return id;
}

export function useAuth() {
  const [auth, setAuthState] = useState(readAuth);

  const setAuth = useCallback((next) => {
    if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else localStorage.removeItem(STORAGE_KEY);
    setAuthState(next);
  }, []);

  const patchAuth = useCallback((patch) => {
    setAuthState((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { auth, setAuth, patchAuth };
}
