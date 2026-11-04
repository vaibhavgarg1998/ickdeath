"use client";

import { useEffect, useState } from "react";
import { useAdminAuth } from "@/components/admin/AdminAuthProvider";
import {
  RESTAURANT_SUBSCRIPTION_STATUSES,
  subscribeRestaurantSubscriptions,
  updateRestaurantSubscriptionStatus,
  type RestaurantSubscription,
  type RestaurantSubscriptionStatus,
} from "@/lib/restaurant-subscriptions";

export function AdminRestaurantsPanel() {
  const { user, configured } = useAdminAuth();
  const [rows, setRows] = useState<RestaurantSubscription[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !configured) return;

    return subscribeRestaurantSubscriptions(
      (list) => {
        setRows(list);
        setError(null);
      },
      (err) => setError(err.message),
    );
  }, [user, configured]);

  async function onStatus(
    id: string,
    status: RestaurantSubscriptionStatus,
  ) {
    setSavingId(id);
    setError(null);
    try {
      await updateRestaurantSubscriptionStatus(id, status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update status");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-[family-name:var(--font-bebas)] text-3xl tracking-wide text-neon sm:text-4xl">
          Restaurants
        </h1>
        <p className="mt-1 font-[family-name:var(--font-ibm-plex)] text-xs text-text-dim">
          Monthly subscription requests · {rows.length} total
        </p>
      </div>

      {error ? (
        <p className="mb-4 font-[family-name:var(--font-ibm-plex)] text-sm text-red-400">
          {error}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left font-[family-name:var(--font-ibm-plex)] text-sm">
            <thead className="bg-white/5 text-xs uppercase tracking-wider text-text-dim">
              <tr>
                <th className="px-3 py-3">Restaurant</th>
                <th className="px-3 py-3">Contact</th>
                <th className="px-3 py-3">Requested</th>
                <th className="px-3 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-text-dim">
                    No restaurant signups yet.
                  </td>
                </tr>
              ) : null}
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-white/10">
                  <td className="px-3 py-3">
                    <div className="text-white">{row.restaurantName}</div>
                    <div className="text-xs text-text-dim">{row.id}</div>
                  </td>
                  <td className="px-3 py-3">
                    <div>{row.name}</div>
                    <div className="text-xs text-text-dim">+91 {row.phone}</div>
                    <div className="text-xs text-text-dim">{row.email}</div>
                  </td>
                  <td className="px-3 py-3 text-text-dim">
                    {formatWhen(row.createdAt)}
                  </td>
                  <td className="px-3 py-3">
                    <select
                      aria-label={`Status for ${row.restaurantName}`}
                      value={row.status}
                      disabled={savingId === row.id}
                      onChange={(event) =>
                        void onStatus(
                          row.id,
                          event.target.value as RestaurantSubscriptionStatus,
                        )
                      }
                      className="rounded-lg border border-white/15 bg-bg px-2 py-2 text-sm capitalize text-white outline-none focus:border-neon disabled:opacity-50"
                    >
                      {RESTAURANT_SUBSCRIPTION_STATUSES.map((status) => (
                        <option key={status} value={status} className="bg-bg">
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
