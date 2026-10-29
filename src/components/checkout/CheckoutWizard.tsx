"use client";

import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import {
  getCheckoutDraftServerSnapshot,
  getCheckoutDraftSnapshot,
  saveCheckoutDraft,
  subscribeCheckoutDraft,
} from "@/lib/checkout-storage";
import { trackButtonClick } from "@/lib/analytics";
import { startCodCheckout, startHdfcCheckout } from "@/lib/place-order";
import { HDFC_CHECKOUT_ENABLED, type CheckoutPaymentChoice } from "@/lib/payments";
import { isColorwayId } from "@/lib/product";
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

type PaymentNotice = {
  step: StepId;
  error: string;
};

function paymentNoticeFromSearch(search: string): PaymentNotice | null {
  const payment = new URLSearchParams(search).get("payment");
  if (payment === "cancelled") {
    return { step: "payment", error: "Payment was cancelled. You can try again." };
  }
  if (payment === "pending") {
    return {
      step: "payment",
      error:
        "Payment is still processing. We'll confirm this order shortly — don't pay again yet.",
    };
  }
  if (payment === "review") {
    return {
      step: "payment",
      error:
        "We received a payment we couldn't match. Message us on WhatsApp with your order ID before paying again.",
    };
  }
  if (payment === "failed") {
    return { step: "payment", error: "Payment failed. You can try again." };
  }
  return null;
}

function subscribeNoop() {
  return () => {};
}

export function CheckoutWizard() {
  const draft = useSyncExternalStore(
    subscribeCheckoutDraft,
    getCheckoutDraftSnapshot,
    getCheckoutDraftServerSnapshot,
  );
  const paymentNotice = useSyncExternalStore(
    subscribeNoop,
    () => paymentNoticeFromSearch(window.location.search),
    () => null,
  );
  const [stepOverride, setStep] = useState<StepId | null>(null);
  const [errorOverride, setError] = useState<string | null | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [method, setMethod] = useState<CheckoutPaymentChoice>("cod");
  const step = stepOverride ?? paymentNotice?.step ?? "quantity";
  const error = errorOverride !== undefined ? errorOverride : (paymentNotice?.error ?? null);

  useEffect(() => {
    const edition = new URLSearchParams(window.location.search).get("edition");
    if (!isColorwayId(edition)) return;

    const current = getCheckoutDraftSnapshot();
    if (current.colorway === edition) return;

    // Deep link only focuses the edition — quantity stays user-controlled.
    saveCheckoutDraft({
      ...current,
      colorway: edition,
    });
  }, []);

  function updateDraft(next: Parameters<typeof saveCheckoutDraft>[0]) {
    saveCheckoutDraft(next);
  }

  const stepIndex = STEPS.findIndex((s) => s.id === step);

  async function handlePlaceOrder() {
    setSubmitting(true);
    setError(null);
    try {
      if (method === "hdfc") {
        if (!HDFC_CHECKOUT_ENABLED) {
          setError("Online payment is paused. Use cash on delivery.");
          setSubmitting(false);
          return;
        }
        await startHdfcCheckout({ draft });
        return;
      }
      await startCodCheckout({ draft });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not place order. Please try again.";

      if (message.includes("Firebase")) {
        setError("Order could not be saved. Check Firebase configuration.");
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
            onNext={() => {
              trackButtonClick("checkout_continue_quantity");
              setStep("contact");
            }}
          />
        ) : null}
        {step === "contact" ? (
          <StepContact
            draft={draft}
            onChange={updateDraft}
            onBack={() => setStep("quantity")}
            onNext={() => {
              trackButtonClick("checkout_continue_contact");
              setStep("address");
            }}
          />
        ) : null}
        {step === "address" ? (
          <StepAddress
            draft={draft}
            onChange={updateDraft}
            onBack={() => setStep("contact")}
            onNext={() => {
              trackButtonClick("checkout_continue_address");
              setStep("summary");
            }}
          />
        ) : null}
        {step === "summary" ? (
          <StepSummary
            draft={draft}
            onBack={() => setStep("address")}
            onNext={() => {
              trackButtonClick("checkout_continue_summary");
              setStep("payment");
            }}
          />
        ) : null}
        {step === "payment" ? (
          <StepPayment
            draft={draft}
            method={method}
            onMethod={setMethod}
            onBack={() => setStep("summary")}
            onPlaceOrder={() => {
              trackButtonClick(
                method === "cod" ? "checkout_place_cod" : "checkout_place_order",
              );
              void handlePlaceOrder();
            }}
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
