import { createContext, useCallback, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "snapy_seller";
const BUYER_KEY = "snapy_buyer_id";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuthState] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => setAuthState(raw ? JSON.parse(raw) : null))
      .catch(() => setAuthState(null))
      .finally(() => setReady(true));
  }, []);

  const setAuth = useCallback((next) => {
    setAuthState(next);
    if (next) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  const patchAuth = useCallback((patch) => {
    setAuthState((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return <AuthContext.Provider value={{ auth, setAuth, patchAuth, ready }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

let cachedBuyerId = null;
export async function getBuyerId() {
  if (cachedBuyerId) return cachedBuyerId;
  let id = await AsyncStorage.getItem(BUYER_KEY);
  if (!id) {
    id = "Acheteur-" + Math.random().toString(36).slice(2, 6).toUpperCase();
    await AsyncStorage.setItem(BUYER_KEY, id);
  }
  cachedBuyerId = id;
  return id;
}
