"use client";
import { createContext, useContext, useEffect, useState } from "react";
import api from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("luxe_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .me()
      .then((res) => setUser(res.user))
      .catch(() => {
        localStorage.removeItem("luxe_token");
      })
      .finally(() => setLoading(false));
  }, []);

  const persist = (res) => {
    localStorage.setItem("luxe_token", res.token);
    setUser(res.user);
    return res.user;
  };

  const login = async (email, password) => persist(await api.login({ email, password }));
  const register = async (name, email, password) =>
    persist(await api.register({ name, email, password }));

  const updateProfile = async (payload) => {
    const res = await api.updateProfile(payload);
    setUser(res.user);
    return res.user;
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {}
    localStorage.removeItem("luxe_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, updateProfile, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
