"use client";

import type { CheckoutDraft } from "@/lib/orders";
import { formatINR, lineTotalPaise } from "@/lib/product";

type Props = {
  draft: CheckoutDraft;
  onBack: () => void;
  onPlaceOrder: () => void;
  submitting: boolean;
  error: string | null;
};

export function StepPayment({
  draft,
  onBack,
  onPlaceOrder,
  submitting,
  error,
}: Props) {
  const total = lineTotalPaise(draft.quantity);
  const cta = submitting ? "Opening Razorpay…" : `Pay ${formatINR(total)}`;

  return (
    <div>
      <h2 className="font-[family-name:var(--font-bebas)] text-3xl tracking-wide text-white sm:text-4xl">
        Payment
      </h2>
      <p className="mt-2 font-[family-name:var(--font-ibm-plex)] text-sm text-text-dim">
        Amount due:{" "}
        <span className="text-neon">{formatINR(total)}</span>. Pay securely
        with UPI, cards, netbanking, or wallets. You&apos;ll get tracking
        updates on WhatsApp after the order is placed.
      </p>

      {error ? (
        <p className="mt-4 font-[family-name:var(--font-ibm-plex)] text-sm text-red-400">
          {error}
        </p>
      ) : null}

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-11 items-center px-4 font-[family-name:var(--font-ibm-plex)] text-sm text-text-dim transition-colors hover:text-white"
        >
          Back
        </button>
        <button
          type="button"
          disabled={submitting}
          onClick={onPlaceOrder}
          className="inline-flex h-12 items-center bg-neon px-6 font-[family-name:var(--font-anton)] text-sm uppercase tracking-[0.14em] text-bg transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {cta}
        </button>
      </div>
    </div>
  );
}
