"use client";

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";

type AdminAuthContextValue = {
  user: User | null;
  loading: boolean;
  configured: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const configured = isFirebaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(configured);

  useEffect(() => {
    if (!configured) return;

    const unsub = onAuthStateChanged(getFirebaseAuth(), (next) => {
      setUser(next);
      setLoading(false);
    });
    return unsub;
  }, [configured]);

  const login = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
  }, []);

  const logout = useCallback(async () => {
    await signOut(getFirebaseAuth());
  }, []);

  const value = useMemo(
    () => ({ user, loading, configured, login, logout }),
    [user, loading, configured, login, logout],
  );

  return (
    <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}
