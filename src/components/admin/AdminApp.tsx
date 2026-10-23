"use client";

import { useState } from "react";
import { useAdminAuth } from "@/components/admin/AdminAuthProvider";
import { AdminAnalyticsPanel } from "@/components/admin/AdminAnalyticsPanel";
import { AdminOrdersPanel } from "@/components/admin/AdminOrdersPanel";
import { AdminRestaurantsPanel } from "@/components/admin/AdminRestaurantsPanel";
import {
  AdminLoginForm,
  AdminMessage,
  AdminShell,
  type AdminTab,
} from "@/components/admin/AdminShell";

export function AdminApp() {
  const { user, loading, configured, logout } = useAdminAuth();
  const [tab, setTab] = useState<AdminTab>("orders");

  if (!configured) {
    return (
      <AdminShell>
        <AdminMessage>
          Firebase is not configured. Add{" "}
          <code className="text-neon">NEXT_PUBLIC_FIREBASE_*</code> keys to{" "}
          <code className="text-neon">.env.local</code>. See{" "}
          <code className="text-neon">docs/firebase-setup.md</code>.
        </AdminMessage>
      </AdminShell>
    );
  }

  if (loading) {
    return (
      <AdminShell>
        <AdminMessage>Checking admin session…</AdminMessage>
      </AdminShell>
    );
  }

  if (!user) {
    return (
      <AdminShell>
        <AdminLoginForm />
      </AdminShell>
    );
  }

  return (
    <AdminShell tab={tab} onTabChange={setTab}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="font-[family-name:var(--font-ibm-plex)] text-xs text-text-dim">
          Signed in as {user.email} · live
        </p>
        <button
          type="button"
          onClick={() => void logout()}
          className="h-10 border border-white/20 px-4 font-[family-name:var(--font-anton)] text-xs uppercase tracking-wider text-text-dim"
        >
          Log out
        </button>
      </div>

      {tab === "orders" ? (
        <AdminOrdersPanel />
      ) : tab === "restaurants" ? (
        <AdminRestaurantsPanel />
      ) : (
        <AdminAnalyticsPanel />
      )}
    </AdminShell>
  );
}
