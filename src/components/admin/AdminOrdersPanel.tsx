"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useAdminAuth } from "@/components/admin/AdminAuthProvider";
import {
  subscribeOrders,
  updateOrderStatuses,
  type OrderRecord,
} from "@/lib/orders-db";
import { updateAdminOrderStatus, AdminApiError } from "@/lib/admin-api";
import {
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  paymentMethodLabel,
  type OrderStatus,
  type PaymentStatus,
} from "@/lib/orders";
import { formatINR, formatOrderItems } from "@/lib/product";

export function AdminOrdersPanel() {
  const { user, configured } = useAdminAuth();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [whatsappNote, setWhatsappNote] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

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

  const filteredOrders = orders.filter((order) =>
    orderMatchesDateRange(order.createdAt, dateFrom, dateTo),
  );
  const selected =
    filteredOrders.find((o) => o.orderId === selectedId) ?? null;
  const hasDateFilter = Boolean(dateFrom || dateTo);

  async function patchStatus(input: {
    orderStatus?: OrderStatus;
    paymentStatus?: PaymentStatus;
    resendWhatsApp?: boolean;
  }) {
    if (!selected || !user) return;
    setSaving(true);
    setError(null);
    setWhatsappNote(null);
    try {
      const token = await user.getIdToken();
      const result = await updateAdminOrderStatus({
        token,
        orderId: selected.orderId,
        orderStatus: input.orderStatus,
        paymentStatus: input.paymentStatus,
        resendWhatsApp: input.resendWhatsApp,
      });
      if (result.whatsapp?.sent) {
        setWhatsappNote("WhatsApp update sent");
      } else if (result.whatsapp?.error) {
        setWhatsappNote(`WhatsApp: ${result.whatsapp.error}`);
      } else if (result.whatsapp?.skipped) {
        setWhatsappNote(result.whatsapp.skipped);
      }
    } catch (e) {
      if (input.resendWhatsApp) {
        setError(e instanceof Error ? e.message : "Failed to send WhatsApp");
      } else if (e instanceof AdminApiError && e.status !== 503) {
        setError(e.message);
      } else {
        try {
          await updateOrderStatuses({
            orderId: selected.orderId,
            orderStatus: input.orderStatus,
            paymentStatus: input.paymentStatus,
          });
        } catch (fallbackErr) {
          setError(
            fallbackErr instanceof Error
              ? fallbackErr.message
              : "Failed to update order",
          );
        }
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-[family-name:var(--font-bebas)] text-3xl tracking-wide text-neon sm:text-4xl">
          Orders
        </h1>
        <p className="mt-1 font-[family-name:var(--font-ibm-plex)] text-xs text-text-dim">
          Live order list · update fulfillment and payment status
        </p>
      </div>

      {error ? (
        <p className="mb-4 font-[family-name:var(--font-ibm-plex)] text-sm text-red-400">
          {error}
        </p>
      ) : null}

      <div className="mb-5 flex flex-wrap items-end gap-3 rounded-xl border border-white/10 bg-bg-elevated p-4">
        <label className="min-w-[140px] flex-1">
          <span className="mb-1.5 block font-[family-name:var(--font-ibm-plex)] text-xs uppercase tracking-wider text-text-dim">
            From
          </span>
          <input
            type="date"
            value={dateFrom}
            max={dateTo || undefined}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full rounded-lg border border-white/15 bg-bg px-3 py-2.5 font-[family-name:var(--font-ibm-plex)] text-sm text-white outline-none focus:border-neon [color-scheme:dark]"
          />
        </label>
        <label className="min-w-[140px] flex-1">
          <span className="mb-1.5 block font-[family-name:var(--font-ibm-plex)] text-xs uppercase tracking-wider text-text-dim">
            To
          </span>
          <input
            type="date"
            value={dateTo}
            min={dateFrom || undefined}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full rounded-lg border border-white/15 bg-bg px-3 py-2.5 font-[family-name:var(--font-ibm-plex)] text-sm text-white outline-none focus:border-neon [color-scheme:dark]"
          />
        </label>
        <button
          type="button"
          disabled={!hasDateFilter}
          onClick={() => {
            setDateFrom("");
            setDateTo("");
          }}
          className="h-[42px] border border-white/20 px-4 font-[family-name:var(--font-anton)] text-xs uppercase tracking-wider text-text-dim hover:text-white disabled:opacity-40"
        >
          Clear
        </button>
        <p className="w-full font-[family-name:var(--font-ibm-plex)] text-xs text-text-dim sm:ml-auto sm:w-auto">
          Showing {filteredOrders.length}
          {hasDateFilter ? ` of ${orders.length}` : ""} orders
        </p>
      </div>

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
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-3 py-8 text-center text-text-dim"
                    >
                      {orders.length === 0
                        ? "No orders yet."
                        : "No orders in this date range."}
                    </td>
                  </tr>
                ) : null}
                {filteredOrders.map((order) => {
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
              whatsappNote={whatsappNote}
              onOrderStatus={(orderStatus) => void patchStatus({ orderStatus })}
              onPaymentStatus={(paymentStatus) =>
                void patchStatus({ paymentStatus })
              }
              onResendWhatsApp={() =>
                void patchStatus({
                  orderStatus: selected.orderStatus,
                  resendWhatsApp: true,
                })
              }
            />
          ) : (
            <p className="font-[family-name:var(--font-ibm-plex)] text-sm text-text-dim">
              Select an order to view details and update status.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/** Match `createdAt` against local YYYY-MM-DD from/to inputs (inclusive). */
function orderMatchesDateRange(
  createdAt: string,
  dateFrom: string,
  dateTo: string,
): boolean {
  if (!dateFrom && !dateTo) return true;
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return false;

  if (dateFrom) {
    const from = new Date(`${dateFrom}T00:00:00`);
    if (created < from) return false;
  }
  if (dateTo) {
    const to = new Date(`${dateTo}T23:59:59.999`);
    if (created > to) return false;
  }
  return true;
}

function OrderDetail({
  order,
  saving,
  whatsappNote,
  onOrderStatus,
  onPaymentStatus,
  onResendWhatsApp,
}: {
  order: OrderRecord;
  saving: boolean;
  whatsappNote: string | null;
  onOrderStatus: (status: OrderStatus) => void;
  onPaymentStatus: (status: PaymentStatus) => void;
  onResendWhatsApp: () => void;
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
        <Row label="Product">{formatOrderItems(order)}</Row>
        <Row label="Amount">{formatINR(order.amountPaise)}</Row>
        <Row label="Payment method" className="capitalize">
          {paymentMethodLabel(order.paymentMethod)}
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
        <p className="font-[family-name:var(--font-ibm-plex)] text-xs text-text-dim">
          Payment status updates automatically from HDFC SmartGateway (
          <span className="text-white/70">pending → paid / failed</span>
          ). Order status starts as{" "}
          <span className="text-white/70">confirmed</span>. You can change either
          anytime.
        </p>

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

        <div className="space-y-2 border-t border-white/10 pt-5">
          <span className="block text-xs uppercase tracking-wider text-text-dim">
            WhatsApp
          </span>
          {order.whatsapp?.lastEvent ? (
            <p className="text-sm text-text-soft">
              Last: {order.whatsapp.lastEvent}
              {order.whatsapp.lastStatus ? ` · ${order.whatsapp.lastStatus}` : ""}
              {order.whatsapp.lastSentAt
                ? ` · ${new Date(order.whatsapp.lastSentAt).toLocaleString("en-IN")}`
                : ""}
            </p>
          ) : (
            <p className="text-sm text-text-dim">
              No Cloud API message sent yet. Status changes send a utility
              template when WhatsApp is configured.
            </p>
          )}
          {order.whatsapp?.lastError ? (
            <p className="text-xs text-red-400">{order.whatsapp.lastError}</p>
          ) : null}
          {whatsappNote ? (
            <p className="text-xs text-neon">{whatsappNote}</p>
          ) : null}
          <button
            type="button"
            disabled={saving}
            onClick={onResendWhatsApp}
            className="h-10 border border-white/20 px-4 font-[family-name:var(--font-anton)] text-xs uppercase tracking-wider text-text-dim hover:text-white disabled:opacity-60"
          >
            Resend WhatsApp update
          </button>
        </div>
      </div>
    </div>
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
