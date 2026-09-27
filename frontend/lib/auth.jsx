"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getAuth, setAuth } from "./api";
import { ROLE_HOME } from "./utils";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const stored = getAuth();
    if (stored?.user) setUser(stored.user);
    setReady(true);
    const onLogout = () => {
      setUser(null);
      router.replace("/login");
    };
    window.addEventListener("skilltrace:logout", onLogout);
    return () => window.removeEventListener("skilltrace:logout", onLogout);
  }, [router]);

  const accept = useCallback((data) => {
    setAuth({ user: data.user, tokens: data.tokens });
    setUser(data.user);
    return data.user;
  }, []);

  const login = useCallback(async (identifier, password) => {
    const data = await api("/auth/login/", { method: "POST", body: { identifier, password }, auth: false });
    return accept(data);
  }, [accept]);

  const refreshUser = useCallback(async () => {
    const me = await api("/me/");
    const stored = getAuth();
    if (stored) setAuth({ ...stored, user: me });
    setUser(me);
    return me;
  }, []);

  const logout = useCallback(() => {
    setAuth(null);
    setUser(null);
    router.replace("/");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, ready, login, logout, accept, refreshUser, home: user ? ROLE_HOME[user.role] : "/login" }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
