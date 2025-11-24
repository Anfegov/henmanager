import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { login as loginApi } from "../api/authApi";

export const AuthContext = createContext(null);

const STORAGE_TOKEN = "token";
const STORAGE_USER = "user";

const normalizePerm = (p) => {
  if (!p) return "";
  if (typeof p === "string") return p.trim();
  if (typeof p === "object") {
    return String(p.code ?? p.Code ?? p.name ?? p.Name ?? "").trim();
  }
  return "";
};

const normalizeRole = (r) => {
  if (!r) return "";
  if (typeof r === "string") return r.trim();
  if (typeof r === "object") {
    return String(r.name ?? r.Name ?? "").trim();
  }
  return "";
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const t = localStorage.getItem(STORAGE_TOKEN);
      const u = localStorage.getItem(STORAGE_USER);
      if (t) setToken(t);
      if (u) setUser(JSON.parse(u));
    } catch {
      localStorage.removeItem(STORAGE_TOKEN);
      localStorage.removeItem(STORAGE_USER);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async ({ userName, password }) => {
    const res = await loginApi({ userName, password });
    const data = res?.data;
    if (!data?.token || !data?.user) throw new Error("Login inválido");

    setToken(data.token);
    setUser(data.user);
    localStorage.setItem(STORAGE_TOKEN, data.token);
    localStorage.setItem(STORAGE_USER, JSON.stringify(data.user));

    return data.user;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(STORAGE_TOKEN);
    localStorage.removeItem(STORAGE_USER);
  }, []);

  const hasPermission = useCallback(
    (code) => {
      if (!code) return true;
      const want = String(code).trim().toLowerCase();
      const list = user?.permissions || user?.Permissions || [];
      return list.some((p) => normalizePerm(p).toLowerCase() === want);
    },
    [user]
  );

  const hasRole = useCallback(
    (roleName) => {
      if (!roleName) return true;
      const want = String(roleName).trim().toLowerCase();
      const list = user?.roles || user?.Roles || [];
      return list.some((r) => normalizeRole(r).toLowerCase() === want);
    },
    [user]
  );

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: !!token,
      login,
      logout,
      hasPermission,
      hasRole,
    }),
    [user, token, loading, login, logout, hasPermission, hasRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
