"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import {
  getPlacedOrderServerSnapshot,
  getPlacedOrderSnapshot,
  subscribePlacedOrder,
} from "@/lib/checkout-storage";
import { formatINR, productNameForColorway } from "@/lib/product";
import { customerWhatsAppUrl } from "@/lib/place-order";
import { TRACK_PATH } from "@/lib/buy";

export function CheckoutSuccessClient() {
  const order = useSyncExternalStore(
    subscribePlacedOrder,
    getPlacedOrderSnapshot,
    getPlacedOrderServerSnapshot,
  );

  const wa = order ? customerWhatsAppUrl(order) : null;

  return (
    <div className="min-h-screen bg-bg pb-[env(safe-area-inset-bottom)]">
      <main className="mx-auto w-full max-w-xl px-4 py-12 sm:px-0 sm:py-16">
        <div className="rounded-2xl border border-neon/40 bg-bg-elevated p-6 sm:p-10">
          <p className="font-[family-name:var(--font-ibm-plex)] text-xs uppercase tracking-[0.2em] text-neon">
            Order placed
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-bebas)] text-4xl tracking-wide text-white sm:text-5xl">
            You&apos;re all set
          </h1>

          {order ? (
            <>
              <p className="mt-4 font-[family-name:var(--font-ibm-plex)] text-sm text-text-dim">
                Order{" "}
                <span className="text-neon">{order.orderId}</span> is confirmed.
                We&apos;ll send updates on WhatsApp to{" "}
                <span className="text-white">+91 {order.contact.phone}</span>.
                Reply to that chat anytime to check status.
              </p>

              <dl className="mt-8 space-y-3 font-[family-name:var(--font-ibm-plex)] text-sm text-text-soft">
                <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                  <dt className="text-text-dim">Product</dt>
                  <dd>
                    {productNameForColorway(order.colorway)} × {order.quantity}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                  <dt className="text-text-dim">Amount</dt>
                  <dd className="text-neon">{formatINR(order.amountPaise)}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                  <dt className="text-text-dim">Payment</dt>
                  <dd className="capitalize">
                    {order.paymentMethod} · {order.paymentStatus}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-text-dim">Status</dt>
                  <dd className="capitalize">{order.orderStatus}</dd>
                </div>
              </dl>

              <div className="mt-8 space-y-3">
                {wa ? (
                  <a
                    href={wa}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-12 w-full items-center justify-center bg-[#25D366] font-[family-name:var(--font-anton)] text-sm uppercase tracking-[0.14em] text-white transition-opacity hover:opacity-90"
                  >
                    Message us on WhatsApp
                  </a>
                ) : (
                  <p className="rounded-lg border border-white/10 bg-bg p-3 text-xs text-text-dim">
                    Set{" "}
                    <code className="text-neon">NEXT_PUBLIC_WHATSAPP_NUMBER</code>{" "}
                    to enable the WhatsApp button.
                  </p>
                )}
                <Link
                  href={`${TRACK_PATH}?order=${encodeURIComponent(order.orderId)}`}
                  className="flex h-12 w-full items-center justify-center border border-neon/50 font-[family-name:var(--font-anton)] text-sm uppercase tracking-[0.14em] text-neon transition-opacity hover:opacity-90"
                >
                  Track this order
                </Link>
                <Link
                  href="/"
                  className="flex h-12 w-full items-center justify-center border border-white/20 font-[family-name:var(--font-anton)] text-sm uppercase tracking-[0.14em] text-text-dim transition-colors hover:text-white"
                >
                  Back to home
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="mt-4 font-[family-name:var(--font-ibm-plex)] text-sm text-text-dim">
                No order found in this browser session. If you just ordered,
                check WhatsApp for your confirmation, or track with your order
                ID or mobile number.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={TRACK_PATH}
                  className="inline-flex h-12 items-center justify-center border border-neon/50 px-6 font-[family-name:var(--font-anton)] text-sm uppercase tracking-[0.14em] text-neon"
                >
                  Track order
                </Link>
                <Link
                  href="/checkout/"
                  className="inline-flex h-12 items-center justify-center bg-neon px-6 font-[family-name:var(--font-anton)] text-sm uppercase tracking-[0.14em] text-bg"
                >
                  Start checkout
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
