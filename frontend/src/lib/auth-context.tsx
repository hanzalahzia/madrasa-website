"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "./api";
import { invalidateApiCache } from "./use-api";
import type { PortalProfile, PublicUser } from "./types";

interface AuthResponse {
  user: PublicUser;
  profile: PortalProfile | null;
}

interface AuthContextValue {
  user: PublicUser | null;
  profile: PortalProfile | null;
  loading: boolean;
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (input: { name: string; email: string; phone?: string; password: string }) => Promise<AuthResponse>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [profile, setProfile] = useState<PortalProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const result = await api<AuthResponse>("/auth/me");
      setUser(result.user);
      setProfile(result.profile);
    } catch {
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await api<AuthResponse>("/auth/login", {
      method: "POST",
      body: { email, password }
    });
    invalidateApiCache();
    setUser(result.user);
    setProfile(result.profile);
    return result;
  }, []);

  const register = useCallback(
    async (input: { name: string; email: string; phone?: string; password: string }) => {
      const result = await api<AuthResponse>("/auth/register", { method: "POST", body: input });
      invalidateApiCache();
      setUser(result.user);
      setProfile(result.profile);
      return result;
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await api("/auth/logout", { method: "POST" });
    } finally {
      invalidateApiCache();
      setUser(null);
      setProfile(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, profile, loading, refresh, login, register, logout }),
    [user, profile, loading, refresh, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}

export function portalPathFor(role: string | undefined): string {
  if (role === "super_admin") return "/admin";
  if (role === "teacher" || role === "student" || role === "guardian" || role === "customer") return "/portal";
  return "/";
}
