"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useAdminAuth } from "@/components/admin/AdminAuthProvider";
import {
  subscribeOrders,
  updateOrderStatuses,
  type OrderRecord,
} from "@/lib/orders-db";
import {
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  type OrderStatus,
  type PaymentStatus,
} from "@/lib/orders";
import { formatINR } from "@/lib/product";

export function AdminOrdersPanel() {
  const { user, loading, configured, logout } = useAdminAuth();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user || !configured) {
      return;
    }

    const unsub = subscribeOrders(
      (list) => {
        setOrders(list);
        setError(null);
      },
      (err) => {
        setError(err.message);
      },
    );

    return unsub;
  }, [user, configured]);

  const selected = orders.find((o) => o.orderId === selectedId) ?? null;

  async function patchStatus(input: {
    orderStatus?: OrderStatus;
    paymentStatus?: PaymentStatus;
  }) {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      await updateOrderStatuses({ orderId: selected.orderId, ...input });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update order");
    } finally {
      setSaving(false);
    }
  }

  if (!configured) {
    return (
      <Shell>
        <Message>
          Firebase is not configured. Add{" "}
          <code className="text-neon">NEXT_PUBLIC_FIREBASE_*</code> keys to{" "}
          <code className="text-neon">.env.local</code>. See{" "}
          <code className="text-neon">docs/firebase-setup.md</code>.
        </Message>
      </Shell>
    );
  }

  if (loading) {
    return (
      <Shell>
        <Message>Checking admin session…</Message>
      </Shell>
    );
  }

  if (!user) {
    return (
      <Shell>
        <AdminLoginForm />
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-bebas)] text-3xl tracking-wide text-neon sm:text-4xl">
            Orders
          </h1>
          <p className="mt-1 font-[family-name:var(--font-ibm-plex)] text-xs text-text-dim">
            Signed in as {user.email} · live
          </p>
        </div>
        <button
          type="button"
          onClick={() => void logout()}
          className="h-10 border border-white/20 px-4 font-[family-name:var(--font-anton)] text-xs uppercase tracking-wider text-text-dim"
        >
          Log out
        </button>
      </div>

      {error ? (
        <p className="mb-4 font-[family-name:var(--font-ibm-plex)] text-sm text-red-400">
          {error}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="overflow-hidden rounded-xl border border-white/10">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left font-[family-name:var(--font-ibm-plex)] text-sm">
              <thead className="bg-white/5 text-xs uppercase tracking-wider text-text-dim">
                <tr>
                  <th className="px-3 py-3">Order</th>
                  <th className="px-3 py-3">Customer</th>
                  <th className="px-3 py-3">Amount</th>
                  <th className="px-3 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-3 py-8 text-center text-text-dim"
                    >
                      No orders yet.
                    </td>
                  </tr>
                ) : null}
                {orders.map((order) => {
                  const active = order.orderId === selectedId;
                  return (
                    <tr
                      key={order.orderId}
                      className={`cursor-pointer border-t border-white/10 ${
                        active ? "bg-neon/10" : "hover:bg-white/5"
                      }`}
                      onClick={() => setSelectedId(order.orderId)}
                    >
                      <td className="px-3 py-3 text-neon">{order.orderId}</td>
                      <td className="px-3 py-3">
                        <div>{order.contact.name}</div>
                        <div className="text-xs text-text-dim">
                          +91 {order.contact.phone}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        {formatINR(order.amountPaise)}
                      </td>
                      <td className="px-3 py-3 capitalize">
                        {order.orderStatus}
                        <div className="text-xs text-text-dim capitalize">
                          pay: {order.paymentStatus}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-bg-elevated p-5">
          {selected ? (
            <OrderDetail
              order={selected}
              saving={saving}
              onOrderStatus={(orderStatus) => void patchStatus({ orderStatus })}
              onPaymentStatus={(paymentStatus) =>
                void patchStatus({ paymentStatus })
              }
            />
          ) : (
            <p className="font-[family-name:var(--font-ibm-plex)] text-sm text-text-dim">
              Select an order to view details and update status.
            </p>
          )}
        </div>
      </div>
    </Shell>
  );
}

function OrderDetail({
  order,
  saving,
  onOrderStatus,
  onPaymentStatus,
}: {
  order: OrderRecord;
  saving: boolean;
  onOrderStatus: (status: OrderStatus) => void;
  onPaymentStatus: (status: PaymentStatus) => void;
}) {
  const addr = order.address;
  return (
    <div>
      <h2 className="font-[family-name:var(--font-bebas)] text-2xl tracking-wide text-white">
        {order.orderId}
      </h2>
      <p className="mt-1 font-[family-name:var(--font-ibm-plex)] text-xs text-text-dim">
        {new Date(order.createdAt).toLocaleString("en-IN")}
      </p>

      <dl className="mt-5 space-y-3 font-[family-name:var(--font-ibm-plex)] text-sm">
        <Row label="Product">
          {order.productName} × {order.quantity}
        </Row>
        <Row label="Amount">{formatINR(order.amountPaise)}</Row>
        <Row label="Payment method" className="capitalize">
          {order.paymentMethod}
        </Row>
        <Row label="Customer">
          {order.contact.name}
          <br />
          +91 {order.contact.phone}
          {order.contact.email ? (
            <>
              <br />
              {order.contact.email}
            </>
          ) : null}
        </Row>
        <Row label="Ship to">
          {addr.line1}
          {addr.line2 ? (
            <>
              <br />
              {addr.line2}
            </>
          ) : null}
          <br />
          {addr.city}, {addr.state} {addr.pincode}
        </Row>
      </dl>

      <div className="mt-6 space-y-4 border-t border-white/10 pt-5">
        <label className="block">
          <span className="mb-1.5 block text-xs uppercase tracking-wider text-text-dim">
            Order status
          </span>
          <select
            disabled={saving}
            value={order.orderStatus}
            onChange={(e) => onOrderStatus(e.target.value as OrderStatus)}
            className="w-full rounded-lg border border-white/15 bg-bg px-3 py-2.5 text-sm text-white outline-none focus:border-neon"
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs uppercase tracking-wider text-text-dim">
            Payment status
          </span>
          <select
            disabled={saving}
            value={order.paymentStatus}
            onChange={(e) => onPaymentStatus(e.target.value as PaymentStatus)}
            className="w-full rounded-lg border border-white/15 bg-bg px-3 py-2.5 text-sm text-white outline-none focus:border-neon"
          >
            {PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        {saving ? <p className="text-xs text-text-dim">Saving…</p> : null}
      </div>
    </div>
  );
}

function AdminLoginForm() {
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
        Sign in to manage ICK DEATH orders.
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

function Shell({ children }: { children: ReactNode }) {
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
      <main className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}

function Message({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-white/10 bg-bg-elevated p-5 font-[family-name:var(--font-ibm-plex)] text-sm text-text-dim">
      {children}
    </p>
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
    <div className="grid gap-1 sm:grid-cols-[110px_1fr]">
      <dt className="text-text-dim">{label}</dt>
      <dd className={`text-text-soft ${className ?? ""}`}>{children}</dd>
    </div>
  );
}
