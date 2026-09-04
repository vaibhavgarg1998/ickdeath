"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
import type { PaymentMethod } from "@/lib/orders";
import {
  clearCheckoutDraft,
  getCheckoutDraftServerSnapshot,
  getCheckoutDraftSnapshot,
  saveCheckoutDraft,
  savePlacedOrder,
  subscribeCheckoutDraft,
} from "@/lib/checkout-storage";
import {
  placeOrder,
  placeOrderWithRazorpay,
  customerWhatsAppUrl,
} from "@/lib/place-order";
import { withBasePath } from "@/lib/paths";
import { StepQuantity } from "@/components/checkout/StepQuantity";
import { StepContact } from "@/components/checkout/StepContact";
import { StepAddress } from "@/components/checkout/StepAddress";
import { StepSummary } from "@/components/checkout/StepSummary";
import { StepPayment } from "@/components/checkout/StepPayment";

const STEPS = [
  { id: "quantity", label: "Quantity" },
  { id: "contact", label: "Contact" },
  { id: "address", label: "Address" },
  { id: "summary", label: "Summary" },
  { id: "payment", label: "Payment" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

export function CheckoutWizard() {
  const draft = useSyncExternalStore(
    subscribeCheckoutDraft,
    getCheckoutDraftSnapshot,
    getCheckoutDraftServerSnapshot,
  );
  const [step, setStep] = useState<StepId>("quantity");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("razorpay");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateDraft(next: Parameters<typeof saveCheckoutDraft>[0]) {
    saveCheckoutDraft(next);
  }

  const stepIndex = STEPS.findIndex((s) => s.id === step);

  async function handlePlaceOrder() {
    setSubmitting(true);
    setError(null);
    try {
      const order =
        paymentMethod === "razorpay"
          ? await placeOrderWithRazorpay({ draft })
          : await placeOrder({ draft, paymentMethod });

      savePlacedOrder(order);
      clearCheckoutDraft();

      const wa = customerWhatsAppUrl(order);
      if (wa && paymentMethod === "whatsapp") {
        window.open(wa, "_blank", "noopener,noreferrer");
      }

      window.location.href = withBasePath(
        `/checkout/success/?order=${encodeURIComponent(order.orderId)}`,
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not place order. Please try again.";

      if (message.includes("cancelled") || message.includes("Payment cancelled")) {
        setError("Payment was cancelled. You can try again.");
      } else if (message.includes("Firebase")) {
        setError("Order could not be saved. Check Firebase configuration.");
      } else if (
        message.includes("Razorpay") ||
        message.includes("payment") ||
        message.includes("503")
      ) {
        setError(message);
      } else {
        setError(message || "Could not place order. Please try again.");
      }
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      <ol className="mb-8 flex flex-wrap items-center gap-2 sm:gap-3">
        {STEPS.map((s, i) => {
          const active = i === stepIndex;
          const done = i < stepIndex;
          return (
            <li key={s.id} className="flex items-center gap-2 sm:gap-3">
              <span
                className={`inline-flex size-7 items-center justify-center rounded-full text-xs font-bold ${
                  active
                    ? "bg-neon text-bg"
                    : done
                      ? "bg-neon/30 text-neon"
                      : "bg-white/10 text-text-dim"
                }`}
              >
                {i + 1}
              </span>
              <span
                className={`hidden text-xs uppercase tracking-wider sm:inline ${
                  active ? "text-neon" : "text-text-dim"
                }`}
              >
                {s.label}
              </span>
              {i < STEPS.length - 1 ? (
                <span className="text-white/20" aria-hidden>
                  /
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>

      <Panel>
        {step === "quantity" ? (
          <StepQuantity
            draft={draft}
            onChange={updateDraft}
            onNext={() => setStep("contact")}
          />
        ) : null}
        {step === "contact" ? (
          <StepContact
            draft={draft}
            onChange={updateDraft}
            onBack={() => setStep("quantity")}
            onNext={() => setStep("address")}
          />
        ) : null}
        {step === "address" ? (
          <StepAddress
            draft={draft}
            onChange={updateDraft}
            onBack={() => setStep("contact")}
            onNext={() => setStep("summary")}
          />
        ) : null}
        {step === "summary" ? (
          <StepSummary
            draft={draft}
            onBack={() => setStep("address")}
            onNext={() => setStep("payment")}
          />
        ) : null}
        {step === "payment" ? (
          <StepPayment
            draft={draft}
            paymentMethod={paymentMethod}
            onPaymentMethodChange={setPaymentMethod}
            onBack={() => setStep("summary")}
            onPlaceOrder={handlePlaceOrder}
            submitting={submitting}
            error={error}
          />
        ) : null}
      </Panel>
    </div>
  );
}

function Panel({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-neon/40 bg-bg-elevated p-5 sm:p-8">
      {children}
    </div>
  );
}
