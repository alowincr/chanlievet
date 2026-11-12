"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  apiFetch,
  clearStoredAuth,
  getStoredAuth,
  saveStoredAuth,
} from "@/lib/api";
import type { AuthResponse, StaffUser } from "@/lib/types";

interface AuthContextValue {
  user: StaffUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<StaffUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StaffUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = getStoredAuth();

    if (!stored) {
      setLoading(false);
      return;
    }

    // Mostramos la sesión guardada mientras el API la valida.
    setUser(stored.user);
    let active = true;

    apiFetch<{ user: StaffUser }>("/api/auth/me")
      .then(({ user: currentUser }) => {
        if (!active) return;
        setUser(currentUser);
        saveStoredAuth({ token: stored.token, user: currentUser });
      })
      .catch(() => {
        if (!active) return;
        clearStoredAuth();
        setUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await apiFetch<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: { email, password },
      auth: false,
    });

    saveStoredAuth({ token: response.token, user: response.user });
    setUser(response.user);
    return response.user;
  }, []);

  const logout = useCallback(() => {
    clearStoredAuth();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, logout }),
    [user, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  }

  return context;
}
