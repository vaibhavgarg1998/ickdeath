"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  FULFILLMENT_STEPS,
  fulfillmentStepIndex,
  parseTrackQuery,
  type OrderStatus,
  type PublicTrackedOrder,
} from "@/lib/orders";
import { formatINR } from "@/lib/product";
import { trackOrders } from "@/lib/track-order";
import { CHECKOUT_PATH } from "@/lib/buy";

const STATUS_COPY: Record<OrderStatus, string> = {
  confirmed: "Confirmed",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export function TrackOrderClient() {
  const searchParams = useSearchParams();
  const initialQuery = (searchParams.get("order") ?? searchParams.get("q") ?? "")
    .trim();

  const [query, setQuery] = useState(initialQuery);
  const [orders, setOrders] = useState<PublicTrackedOrder[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const autoRan = useRef(false);

  async function lookup(raw: string) {
    const parsed = parseTrackQuery(raw);
    if (parsed.kind === "invalid") {
      setError(parsed.message);
      setOrders(null);
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const found = await trackOrders(raw);
      setOrders(found);
      if (found.length === 0) {
        setError("No orders found for that order ID or mobile number.");
      }
    } catch (err) {
      setOrders(null);
      setError(
        err instanceof Error ? err.message : "Could not look up your order",
      );
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (autoRan.current || !initialQuery) return;
    autoRan.current = true;
    void lookup(initialQuery);
  }, [initialQuery]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void lookup(query);
  }

  return (
    <div>
      <p className="font-[family-name:var(--font-ibm-plex)] text-xs uppercase tracking-[0.2em] text-neon">
        Order tracking
      </p>
      <h1 className="mt-3 font-[family-name:var(--font-bebas)] text-4xl tracking-wide text-white sm:text-5xl">
        Track your order
      </h1>
      <p className="mt-3 font-[family-name:var(--font-ibm-plex)] text-sm text-text-dim">
        Enter your order ID (ICK-…) or the WhatsApp number used at checkout.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <label className="block">
          <span className="mb-1.5 block font-[family-name:var(--font-ibm-plex)] text-xs uppercase tracking-wider text-text-dim">
            Order ID or mobile number
          </span>
          <input
            type="text"
            inputMode="text"
            autoComplete="tel"
            placeholder="ICK-20260904-1234 or 98XXXXXXXX"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-lg border border-white/15 bg-bg px-3.5 py-3 font-[family-name:var(--font-inter)] text-sm text-white outline-none placeholder:text-white/30 focus:border-neon"
          />
        </label>

        {error ? (
          <p className="font-[family-name:var(--font-ibm-plex)] text-sm text-red-400">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className="flex h-12 w-full items-center justify-center bg-neon font-[family-name:var(--font-anton)] text-sm uppercase tracking-[0.14em] text-bg transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {busy ? "Looking up…" : "Track order"}
        </button>
      </form>

      {orders && orders.length > 0 ? (
        <div className="mt-8 space-y-5">
          {orders.length > 1 ? (
            <p className="font-[family-name:var(--font-ibm-plex)] text-xs text-text-dim">
              {orders.length} orders found for this number
            </p>
          ) : null}
          {orders.map((order) => (
            <OrderCard key={order.orderId} order={order} />
          ))}
        </div>
      ) : null}

      <Link
        href={CHECKOUT_PATH}
        className="mt-8 inline-flex h-11 items-center font-[family-name:var(--font-ibm-plex)] text-sm text-text-dim transition-colors hover:text-neon"
      >
        Need to order? Buy now →
      </Link>
    </div>
  );
}

function OrderCard({ order }: { order: PublicTrackedOrder }) {
  const placed = order.createdAt
    ? new Date(order.createdAt).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "";
  const shipTo = [order.city, order.state, order.pincode]
    .filter(Boolean)
    .join(", ");

  return (
    <article className="rounded-2xl border border-neon/30 bg-bg p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-[family-name:var(--font-ibm-plex)] text-xs uppercase tracking-wider text-text-dim">
            Order ID
          </p>
          <p className="mt-1 font-[family-name:var(--font-ibm-plex)] text-base text-neon">
            {order.orderId}
          </p>
        </div>
        <StatusBadge status={order.orderStatus} />
      </div>

      <StatusTimeline status={order.orderStatus} />

      <dl className="mt-6 space-y-3 font-[family-name:var(--font-ibm-plex)] text-sm text-text-soft">
        <Row label="Placed">{placed || "—"}</Row>
        <Row label="Product">
          {order.productName} × {order.quantity}
        </Row>
        <Row label="Amount">{formatINR(order.amountPaise)}</Row>
        <Row label="Payment" className="capitalize">
          {order.paymentMethod} · {order.paymentStatus}
        </Row>
        {order.customerName ? (
          <Row label="Name">{order.customerName}</Row>
        ) : null}
        {shipTo ? <Row label="Ships to">{shipTo}</Row> : null}
      </dl>
    </article>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const cancelled = status === "cancelled";
  const delivered = status === "delivered";
  return (
    <span
      className={`inline-flex h-8 items-center rounded-full px-3 font-[family-name:var(--font-ibm-plex)] text-xs uppercase tracking-wider ${
        cancelled
          ? "border border-red-400/50 text-red-400"
          : delivered
            ? "border border-neon/50 bg-neon/10 text-neon"
            : "border border-white/20 text-text-soft"
      }`}
    >
      {STATUS_COPY[status]}
    </span>
  );
}

function StatusTimeline({ status }: { status: OrderStatus }) {
  if (status === "cancelled") {
    return (
      <p className="mt-5 font-[family-name:var(--font-ibm-plex)] text-sm text-red-400">
        This order was cancelled. If you have questions, message us on WhatsApp.
      </p>
    );
  }

  const current = fulfillmentStepIndex(status);

  return (
    <ol className="mt-6 grid grid-cols-4 gap-1">
      {FULFILLMENT_STEPS.map((step, index) => {
        const done = index <= current;
        const active = index === current;
        return (
          <li key={step} className="flex min-w-0 flex-col items-center gap-2">
            <div className="flex w-full items-center">
              <span
                className={`h-px flex-1 ${index === 0 ? "bg-transparent" : done ? "bg-neon" : "bg-white/15"}`}
              />
              <span
                className={`size-2.5 shrink-0 rounded-full ${
                  done ? "bg-neon" : "bg-white/20"
                } ${active ? "ring-2 ring-neon/40 ring-offset-2 ring-offset-bg" : ""}`}
              />
              <span
                className={`h-px flex-1 ${index === FULFILLMENT_STEPS.length - 1 ? "bg-transparent" : index < current ? "bg-neon" : "bg-white/15"}`}
              />
            </div>
            <span
              className={`font-[family-name:var(--font-ibm-plex)] text-[10px] uppercase tracking-wider sm:text-xs ${
                done ? "text-neon" : "text-text-dim"
              }`}
            >
              {STATUS_COPY[step]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function Row({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="flex justify-between gap-4 border-b border-white/10 pb-3 last:border-0 last:pb-0">
      <dt className="text-text-dim">{label}</dt>
      <dd className={`text-right ${className ?? ""}`}>{children}</dd>
    </div>
  );
}
