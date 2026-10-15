"use client";

import { useEffect, useState } from "react";
import {
  aggregateEditionStats,
  subscribeButtonClicks,
  TRACKED_BUTTONS,
  type ButtonClickCounts,
  type EditionOrderStat,
} from "@/lib/analytics";
import { subscribeOrders, type OrderRecord } from "@/lib/orders-db";
import { formatINR } from "@/lib/product";
import { useAdminAuth } from "@/components/admin/AdminAuthProvider";

export function AdminAnalyticsPanel() {
  const { user, configured } = useAdminAuth();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [clicks, setClicks] = useState<ButtonClickCounts>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !configured) return;

    const unsubOrders = subscribeOrders(
      (list) => {
        setOrders(list);
        setError(null);
      },
      (err) => setError(err.message),
    );

    const unsubClicks = subscribeButtonClicks(
      (counts) => {
        setClicks(counts);
        setError(null);
      },
      (err) => setError(err.message),
    );

    return () => {
      unsubOrders();
      unsubClicks();
    };
  }, [user, configured]);

  const editionStats = aggregateEditionStats(orders);
  const totalUnits = editionStats.reduce((sum, row) => sum + row.units, 0);
  const totalClicks = TRACKED_BUTTONS.reduce(
    (sum, button) => sum + (clicks[button.id] ?? 0),
    0,
  );
  const topEdition = editionStats.find((row) => row.units > 0) ?? null;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-[family-name:var(--font-bebas)] text-3xl tracking-wide text-neon sm:text-4xl">
          Analytics
        </h1>
        <p className="mt-1 font-[family-name:var(--font-ibm-plex)] text-xs text-text-dim">
          Edition demand from orders · button clicks from the storefront
        </p>
      </div>

      {error ? (
        <p className="mb-4 font-[family-name:var(--font-ibm-plex)] text-sm text-red-400">
          {error}
        </p>
      ) : null}

      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Units ordered"
          value={String(totalUnits)}
          hint="Excludes cancelled"
        />
        <StatCard
          label="Top edition"
          value={topEdition ? topEdition.name : "—"}
          hint={
            topEdition
              ? `${topEdition.units} units · ${pct(topEdition.units, totalUnits)}`
              : "No orders yet"
          }
        />
        <StatCard
          label="Button clicks"
          value={String(totalClicks)}
          hint="All tracked CTAs"
        />
      </div>

      <section className="mb-10">
        <h2 className="font-[family-name:var(--font-bebas)] text-2xl tracking-wide text-white">
          Edition popularity
        </h2>
        <p className="mt-1 font-[family-name:var(--font-ibm-plex)] text-xs text-text-dim">
          Which product colors customers order most (from cart lines).
        </p>

        <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
          <table className="w-full text-left font-[family-name:var(--font-ibm-plex)] text-sm">
            <thead className="bg-white/5 text-xs uppercase tracking-wider text-text-dim">
              <tr>
                <th className="px-3 py-3">Edition</th>
                <th className="px-3 py-3 text-right">Units</th>
                <th className="px-3 py-3 text-right">Share</th>
                <th className="px-3 py-3 text-right">Orders</th>
                <th className="px-3 py-3 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {editionStats.every((row) => row.units === 0) ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-8 text-center text-text-dim"
                  >
                    No edition data yet.
                  </td>
                </tr>
              ) : (
                editionStats.map((row) => (
                  <EditionRow
                    key={row.colorway}
                    row={row}
                    totalUnits={totalUnits}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="font-[family-name:var(--font-bebas)] text-2xl tracking-wide text-white">
          Button clicks
        </h2>
        <p className="mt-1 font-[family-name:var(--font-ibm-plex)] text-xs text-text-dim">
          Cumulative clicks for storefront and checkout CTAs.
        </p>

        <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
          <table className="w-full text-left font-[family-name:var(--font-ibm-plex)] text-sm">
            <thead className="bg-white/5 text-xs uppercase tracking-wider text-text-dim">
              <tr>
                <th className="px-3 py-3">Button</th>
                <th className="px-3 py-3 text-right">Clicks</th>
                <th className="px-3 py-3 text-right">Share</th>
              </tr>
            </thead>
            <tbody>
              {totalClicks === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-3 py-8 text-center text-text-dim"
                  >
                    No clicks tracked yet. Counts start after deploying this
                    update.
                  </td>
                </tr>
              ) : (
                [...TRACKED_BUTTONS]
                  .map((button) => ({
                    ...button,
                    count: clicks[button.id] ?? 0,
                  }))
                  .sort((a, b) => b.count - a.count)
                  .map((button) => (
                    <tr
                      key={button.id}
                      className="border-t border-white/10"
                    >
                      <td className="px-3 py-3 text-text-soft">
                        {button.label}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-neon">
                        {button.count}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-text-dim">
                        {pct(button.count, totalClicks)}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function EditionRow({
  row,
  totalUnits,
}: {
  row: EditionOrderStat;
  totalUnits: number;
}) {
  const share = totalUnits > 0 ? row.units / totalUnits : 0;
  return (
    <tr className="border-t border-white/10">
      <td className="px-3 py-3">
        <div className="flex items-center gap-2.5">
          <span
            className="size-3.5 shrink-0 rounded-sm border border-white/20"
            style={{ backgroundColor: row.swatch }}
            aria-hidden
          />
          <span className="text-text-soft">{row.name}</span>
        </div>
        <div className="mt-2 h-1.5 max-w-[220px] overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-neon"
            style={{ width: `${Math.round(share * 100)}%` }}
          />
        </div>
      </td>
      <td className="px-3 py-3 text-right tabular-nums text-neon">
        {row.units}
      </td>
      <td className="px-3 py-3 text-right tabular-nums text-text-dim">
        {pct(row.units, totalUnits)}
      </td>
      <td className="px-3 py-3 text-right tabular-nums text-text-soft">
        {row.orders}
      </td>
      <td className="px-3 py-3 text-right tabular-nums text-text-soft">
        {formatINR(row.revenuePaise)}
      </td>
    </tr>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-bg-elevated px-4 py-4">
      <p className="font-[family-name:var(--font-ibm-plex)] text-xs uppercase tracking-wider text-text-dim">
        {label}
      </p>
      <p className="mt-1 font-[family-name:var(--font-bebas)] text-3xl tracking-wide text-neon">
        {value}
      </p>
      <p className="mt-1 font-[family-name:var(--font-ibm-plex)] text-xs text-text-dim">
        {hint}
      </p>
    </div>
  );
}

function pct(part: number, total: number): string {
  if (total <= 0) return "0%";
  return `${Math.round((part / total) * 100)}%`;
}
