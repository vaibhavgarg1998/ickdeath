"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useAdminAuth } from "@/components/admin/AdminAuthProvider";

export type AdminTab = "orders" | "analytics";

export function AdminShell({
  children,
  tab,
  onTabChange,
}: {
  children: ReactNode;
  tab?: AdminTab;
  onTabChange?: (tab: AdminTab) => void;
}) {
  return (
    <div className="min-h-screen bg-bg pb-[env(safe-area-inset-bottom)]">
      <header className="border-b border-white/5">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
          <Link
            href="/"
            className="font-[family-name:var(--font-ibm-plex)] text-sm text-text-dim hover:text-neon"
          >
            ← Storefront
          </Link>
          <p className="font-[family-name:var(--font-bebas)] text-xl tracking-wide text-white">
            ICK DEATH ADMIN
          </p>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        {tab && onTabChange ? (
          <nav className="mb-6 flex gap-2 border-b border-white/10 pb-px">
            {(
              [
                { id: "orders", label: "Orders" },
                { id: "analytics", label: "Analytics" },
              ] as const
            ).map((item) => {
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onTabChange(item.id)}
                  className={`relative px-3 py-2 font-[family-name:var(--font-anton)] text-xs uppercase tracking-wider transition-colors ${
                    active ? "text-neon" : "text-text-dim hover:text-white"
                  }`}
                >
                  {item.label}
                  {active ? (
                    <span className="absolute inset-x-0 -bottom-px h-0.5 bg-neon" />
                  ) : null}
                </button>
              );
            })}
          </nav>
        ) : null}
        {children}
      </main>
    </div>
  );
}

export function AdminMessage({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-white/10 bg-bg-elevated p-5 font-[family-name:var(--font-ibm-plex)] text-sm text-text-dim">
      {children}
    </p>
  );
}

export function AdminLoginForm() {
  const { login } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-neon/40 bg-bg-elevated p-6 sm:p-8">
      <h1 className="font-[family-name:var(--font-bebas)] text-3xl tracking-wide text-neon">
        Admin login
      </h1>
      <p className="mt-2 font-[family-name:var(--font-ibm-plex)] text-sm text-text-dim">
        Sign in to manage ICK DEATH orders and analytics.
      </p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <input
          type="email"
          required
          autoComplete="username"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-white/15 bg-bg px-3.5 py-3 text-sm text-white outline-none focus:border-neon"
        />
        <input
          type="password"
          required
          autoComplete="current-password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-white/15 bg-bg px-3.5 py-3 text-sm text-white outline-none focus:border-neon"
        />
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <button
          type="submit"
          disabled={busy}
          className="flex h-12 w-full items-center justify-center bg-neon font-[family-name:var(--font-anton)] text-sm uppercase tracking-[0.14em] text-bg disabled:opacity-60"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
