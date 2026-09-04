"use client";

import type { CheckoutDraft, PaymentMethod } from "@/lib/orders";
import { formatINR, lineTotalPaise } from "@/lib/product";

type Props = {
  draft: CheckoutDraft;
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  onBack: () => void;
  onPlaceOrder: () => void;
  submitting: boolean;
  error: string | null;
};

const METHODS: { id: PaymentMethod; title: string; hint: string }[] = [
  {
    id: "razorpay",
    title: "Pay online (Razorpay)",
    hint: "UPI, cards, netbanking & wallets — secure checkout",
  },
  {
    id: "whatsapp",
    title: "Pay via WhatsApp",
    hint: "Place order now and complete payment with us on WhatsApp",
  },
];

export function StepPayment({
  draft,
  paymentMethod,
  onPaymentMethodChange,
  onBack,
  onPlaceOrder,
  submitting,
  error,
}: Props) {
  const total = lineTotalPaise(draft.quantity);
  const cta =
    paymentMethod === "razorpay"
      ? submitting
        ? "Opening Razorpay…"
        : `Pay ${formatINR(total)}`
      : submitting
        ? "Placing order…"
        : "Place order";

  return (
    <div>
      <h2 className="font-[family-name:var(--font-bebas)] text-3xl tracking-wide text-white sm:text-4xl">
        Payment
      </h2>
      <p className="mt-2 font-[family-name:var(--font-ibm-plex)] text-sm text-text-dim">
        Amount due:{" "}
        <span className="text-neon">{formatINR(total)}</span>. You&apos;ll get
        tracking updates on WhatsApp after the order is placed.
      </p>

      <fieldset className="mt-6 space-y-3">
        <legend className="sr-only">Payment method</legend>
        {METHODS.map((m) => {
          const selected = paymentMethod === m.id;
          return (
            <label
              key={m.id}
              className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors ${
                selected
                  ? "border-neon bg-neon/10"
                  : "border-white/15 hover:border-white/30"
              }`}
            >
              <input
                type="radio"
                name="payment"
                className="mt-1 accent-[#c1ef04]"
                checked={selected}
                onChange={() => onPaymentMethodChange(m.id)}
              />
              <span>
                <span className="block font-[family-name:var(--font-anton)] text-sm uppercase tracking-wide text-white">
                  {m.title}
                </span>
                <span className="mt-1 block font-[family-name:var(--font-ibm-plex)] text-xs text-text-dim">
                  {m.hint}
                </span>
              </span>
            </label>
          );
        })}
      </fieldset>

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
