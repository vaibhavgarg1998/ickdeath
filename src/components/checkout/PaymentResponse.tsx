"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { clearCheckoutDraft } from "@/lib/checkout-storage";
import { customerWhatsAppUrl } from "@/lib/place-order";
import { formatINRExact } from "@/lib/product";
import { TRACK_PATH } from "@/lib/buy";
import { isFirebaseConfigured } from "@/lib/firebase";
import { getOrderFromFirestore } from "@/lib/orders-db";
import type { PlacedOrder } from "@/lib/orders";

type View =
  | { kind: "loading" }
  | { kind: "missing"; orderId: string | null }
  | { kind: "success"; order: PlacedOrder }
  | { kind: "duplicate"; order: PlacedOrder }
  | { kind: "mismatch"; order: PlacedOrder }
  | { kind: "pending"; order: PlacedOrder }
  | { kind: "cancelled"; order: PlacedOrder }
  | { kind: "failed"; order: PlacedOrder };

function isVerifiedPaid(order: PlacedOrder): boolean {
  if (order.paymentStatus !== "paid" || !order.hdfcOrderId) return false;
  if (order.hdfcAmountPaise == null) return true;
  return order.hdfcAmountPaise === order.amountPaise;
}

function resolveView(
  order: PlacedOrder | null,
  hint: string | null,
  orderId: string | null,
  loaded: boolean,
): View {
  if (!loaded) return { kind: "loading" };
  if (!order) return { kind: "missing", orderId };
  if (hint === "duplicate") return { kind: "duplicate", order };
  if (isVerifiedPaid(order)) return { kind: "success", order };
  if (order.hdfcResult === "mismatch" || hint === "mismatch") {
    return { kind: "mismatch", order };
  }
  if (order.hdfcResult === "cancelled" || hint === "cancelled") {
    return { kind: "cancelled", order };
  }
  if (order.hdfcResult === "failed" || hint === "failed") {
    return { kind: "failed", order };
  }
  if (
    order.hdfcResult === "pending" ||
    order.paymentStatus === "pending" ||
    hint === "pending"
  ) {
    return { kind: "pending", order };
  }
  return { kind: "failed", order };
}

const COPY: Record<
  Exclude<View["kind"], "loading" | "missing">,
  { eyebrow: string; title: string; body: string }
> = {
  success: {
    eyebrow: "Payment successful",
    title: "Payment received",
    body: "HDFC confirmed this charge. The receipt below is the stored order id, amount, and transaction id.",
  },
  failed: {
    eyebrow: "Payment failed",
    title: "Payment was not completed",
    body: "HDFC did not confirm a successful charge. No receipt was generated.",
  },
  cancelled: {
    eyebrow: "Payment failed",
    title: "Payment was cancelled",
    body: "This payment was cancelled before HDFC confirmed a charge. No receipt was generated.",
  },
  mismatch: {
    eyebrow: "Payment failed",
    title: "Payment could not be verified",
    body: "The amount or order id from HDFC did not match this order. No receipt was generated.",
  },
  duplicate: {
    eyebrow: "Duplicate transaction",
    title: "Already recorded",
    body: "This transaction id or order id is already stored. A new receipt was not generated.",
  },
  pending: {
    eyebrow: "Payment pending",
    title: "Payment is processing",
    body: "HDFC has not confirmed this charge yet. Wait for the result before paying again.",
  },
};

function txnLabel(order: PlacedOrder): string {
  return order.hdfcTxnId?.trim() || "Not issued";
}

export function PaymentResponse() {
  const [order, setOrder] = useState<PlacedOrder | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("order");
    setOrderId(id);
    setHint(params.get("result"));
    if (!id || !isFirebaseConfigured()) {
      setLoaded(true);
      return;
    }

    let cancelled = false;
    void getOrderFromFirestore(id)
      .then((record) => {
        if (cancelled) return;
        setOrder(record);
        if (record && isVerifiedPaid(record)) clearCheckoutDraft();
      })
      .catch(() => {
        // Leave the empty state. A missing order is not a receipt.
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const view = resolveView(order, hint, orderId, loaded);

  return (
    <div className="min-h-screen bg-bg pb-[env(safe-area-inset-bottom)]">
      <main className="mx-auto w-full max-w-xl px-4 py-12 sm:px-0 sm:py-16">
        <div className="rounded-2xl border border-neon/40 bg-bg-elevated p-6 sm:p-10">
          {view.kind === "loading" ? (
            <p className="font-[family-name:var(--font-ibm-plex)] text-sm text-text-dim">
              Checking this payment with the stored HDFC response…
            </p>
          ) : view.kind === "missing" ? (
            <Missing orderId={view.orderId} />
          ) : (
            <Result view={view} />
          )}
        </div>
      </main>
    </div>
  );
}

function Missing({ orderId }: { orderId: string | null }) {
  return (
    <>
      <p className="font-[family-name:var(--font-ibm-plex)] text-xs uppercase tracking-[0.2em] text-red-400">
        Payment failed
      </p>
      <h1 className="mt-3 font-[family-name:var(--font-bebas)] text-4xl tracking-wide text-white sm:text-5xl">
        Payment was not completed
      </h1>
      <p className="mt-4 font-[family-name:var(--font-ibm-plex)] text-sm text-text-dim">
        No stored HDFC response was found for this visit, so no receipt was generated.
      </p>
      <Facts
        amount="Not available"
        txnId="Not issued"
        orderId={orderId || "Not available"}
        gatewayOrderId="Not available"
      />
      <Actions success={false} orderId={orderId} wa={null} />
    </>
  );
}

function Result({ view }: { view: Exclude<View, { kind: "loading" } | { kind: "missing" }> }) {
  const copy = COPY[view.kind];
  const order = view.order;
  const success = view.kind === "success";
  const showBankAmount =
    view.kind === "mismatch" &&
    order.hdfcAmountPaise != null &&
    order.hdfcAmountPaise !== order.amountPaise;

  return (
    <>
      <p
        className={`font-[family-name:var(--font-ibm-plex)] text-xs uppercase tracking-[0.2em] ${
          success
            ? "text-neon"
            : view.kind === "pending"
              ? "text-text-soft"
              : "text-red-400"
        }`}
      >
        {copy.eyebrow}
      </p>
      <h1 className="mt-3 font-[family-name:var(--font-bebas)] text-4xl tracking-wide text-white sm:text-5xl">
        {copy.title}
      </h1>
      <p className="mt-4 font-[family-name:var(--font-ibm-plex)] text-sm text-text-dim">
        {copy.body}
      </p>
      <Facts
        amount={formatINRExact(order.amountPaise)}
        bankAmount={showBankAmount ? formatINRExact(order.hdfcAmountPaise ?? 0) : null}
        txnId={txnLabel(order)}
        orderId={order.orderId}
        gatewayOrderId={order.hdfcOrderId || "Not available"}
      />
      <Actions
        success={success}
        orderId={order.orderId}
        wa={success ? customerWhatsAppUrl(order) : null}
      />
    </>
  );
}

function Facts({
  amount,
  bankAmount,
  txnId,
  orderId,
  gatewayOrderId,
}: {
  amount: string;
  bankAmount?: string | null;
  txnId: string;
  orderId: string;
  gatewayOrderId: string;
}) {
  return (
    <dl className="mt-8 space-y-3 font-[family-name:var(--font-ibm-plex)] text-sm text-text-soft">
      <Fact label="Amount">{amount}</Fact>
      {bankAmount ? <Fact label="Amount from HDFC">{bankAmount}</Fact> : null}
      <Fact label="Transaction ID">{txnId}</Fact>
      <Fact label="Order ID">{orderId}</Fact>
      <Fact label="Gateway order ID">{gatewayOrderId}</Fact>
    </dl>
  );
}

function Fact({ label, children }: { label: string; children: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
      <dt className="text-text-dim">{label}</dt>
      <dd className="text-right text-white">{children}</dd>
    </div>
  );
}

function Actions({
  success,
  orderId,
  wa,
}: {
  success: boolean;
  orderId: string | null;
  wa: string | null;
}) {
  return (
    <div className="mt-8 space-y-3">
      {success && wa ? (
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-12 w-full items-center justify-center bg-[#25D366] font-[family-name:var(--font-anton)] text-sm uppercase tracking-[0.14em] text-white transition-opacity hover:opacity-90"
        >
          Message us on WhatsApp
        </a>
      ) : null}
      {orderId ? (
        <Link
          href={`${TRACK_PATH}?order=${encodeURIComponent(orderId)}`}
          className="flex h-12 w-full items-center justify-center border border-neon/50 font-[family-name:var(--font-anton)] text-sm uppercase tracking-[0.14em] text-neon transition-opacity hover:opacity-90"
        >
          Track this order
        </Link>
      ) : null}
      {success ? (
        <Link
          href="/"
          className="flex h-12 w-full items-center justify-center border border-white/20 font-[family-name:var(--font-anton)] text-sm uppercase tracking-[0.14em] text-text-dim transition-colors hover:text-white"
        >
          Back to home
        </Link>
      ) : (
        <Link
          href="/checkout/"
          className="flex h-12 w-full items-center justify-center bg-neon font-[family-name:var(--font-anton)] text-sm uppercase tracking-[0.14em] text-bg"
        >
          Try payment again
        </Link>
      )}
    </div>
  );
}
