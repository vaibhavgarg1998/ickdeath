"use client";

import type { CheckoutDraft } from "@/lib/orders";
import type { CheckoutPaymentChoice } from "@/lib/payments";
import { HDFC_CHECKOUT_ENABLED } from "@/lib/payments";
import { PriceBreakdownPanel } from "@/components/checkout/form-ui";
import { cartTotalPaise, formatINR } from "@/lib/product";

type Props = {
  draft: CheckoutDraft;
  method: CheckoutPaymentChoice;
  onMethod: (method: CheckoutPaymentChoice) => void;
  onBack: () => void;
  onPlaceOrder: () => void;
  submitting: boolean;
  error: string | null;
};

const METHODS: {
  id: CheckoutPaymentChoice;
  label: string;
  detail: string;
  enabled: boolean;
}[] = [
  {
    id: "cod",
    label: "Cash on delivery",
    detail: "Pay the courier in cash when the pack arrives.",
    enabled: true,
  },
  {
    id: "hdfc",
    label: "HDFC SmartGateway",
    detail: HDFC_CHECKOUT_ENABLED
      ? "UPI, cards, or netbanking."
      : "Online payment is paused.",
    enabled: HDFC_CHECKOUT_ENABLED,
  },
];

export function StepPayment({
  draft,
  method,
  onMethod,
  onBack,
  onPlaceOrder,
  submitting,
  error,
}: Props) {
  const total = cartTotalPaise(draft.lines);
  const selected = METHODS.find((item) => item.id === method) ?? METHODS[0]!;
  const cta = submitting
    ? selected.id === "hdfc"
      ? "Opening HDFC…"
      : "Placing order…"
    : selected.id === "hdfc"
      ? `Pay ${formatINR(total)}`
      : `Place order · ${formatINR(total)}`;

  return (
    <div>
      <h2 className="font-[family-name:var(--font-bebas)] text-3xl tracking-wide text-white sm:text-4xl">
        Payment
      </h2>
      <p className="mt-2 font-[family-name:var(--font-ibm-plex)] text-sm text-text-dim">
        {HDFC_CHECKOUT_ENABLED
          ? "Pay online with HDFC, or pay the courier in cash. You'll get tracking updates on WhatsApp after the order is placed."
          : "Cash on delivery is available now. You'll get tracking updates on WhatsApp after the order is placed."}
      </p>

      <div className="mt-6 space-y-3" role="radiogroup" aria-label="Payment method">
        {METHODS.map((item) => {
          const active = item.id === method;
          return (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={!item.enabled || submitting}
              onClick={() => onMethod(item.id)}
              className={`flex w-full items-start justify-between gap-4 rounded-xl border px-4 py-3 text-left transition-colors disabled:cursor-not-allowed ${
                active
                  ? "border-neon bg-neon/10"
                  : "border-white/10 bg-transparent"
              } ${item.enabled ? "hover:border-neon/60" : "opacity-50"}`}
            >
              <span>
                <span className="block font-[family-name:var(--font-ibm-plex)] text-sm text-white">
                  {item.label}
                </span>
                <span className="mt-1 block font-[family-name:var(--font-ibm-plex)] text-xs text-text-dim">
                  {item.detail}
                </span>
              </span>
              <span
                className={`mt-0.5 inline-flex size-4 shrink-0 rounded-full border ${
                  active ? "border-neon bg-neon" : "border-white/30"
                }`}
                aria-hidden
              />
            </button>
          );
        })}
      </div>

      <PriceBreakdownPanel lines={draft.lines} className="mt-6" />

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
          disabled={submitting || !selected.enabled}
          onClick={onPlaceOrder}
          className="inline-flex h-12 items-center bg-neon px-6 font-[family-name:var(--font-anton)] text-sm uppercase tracking-[0.14em] text-bg transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {cta}
        </button>
      </div>
    </div>
  );
}
