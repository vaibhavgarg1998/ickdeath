"use client";

import { useState } from "react";
import { isValidPincode, type CheckoutDraft } from "@/lib/orders";
import { Field, NavRow } from "@/components/checkout/form-ui";

type Props = {
  draft: CheckoutDraft;
  onChange: (draft: CheckoutDraft) => void;
  onBack: () => void;
  onNext: () => void;
};

export function StepAddress({ draft, onChange, onBack, onNext }: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  function setAddress(partial: Partial<CheckoutDraft["address"]>) {
    onChange({ ...draft, address: { ...draft.address, ...partial } });
  }

  function validateAndNext() {
    const a = draft.address;
    const next: Record<string, string> = {};
    if (!a.line1.trim()) next.line1 = "Address is required";
    if (!isValidPincode(a.pincode)) next.pincode = "Enter a valid 6-digit pincode";
    if (!a.city.trim()) next.city = "City is required";
    if (!a.state.trim()) next.state = "State is required";
    setErrors(next);
    if (Object.keys(next).length) return;

    onChange({
      ...draft,
      address: {
        line1: a.line1.trim(),
        line2: a.line2.trim(),
        pincode: a.pincode.trim(),
        city: a.city.trim(),
        state: a.state.trim(),
      },
    });
    onNext();
  }

  return (
    <div>
      <h2 className="font-[family-name:var(--font-bebas)] text-3xl tracking-wide text-white sm:text-4xl">
        Delivery address
      </h2>
      <p className="mt-2 font-[family-name:var(--font-ibm-plex)] text-sm text-text-dim">
        Where should we ship your Seat Safe Tabs?
      </p>

      <div className="mt-6 space-y-4">
        <Field
          label="Pincode"
          id="pincode"
          inputMode="numeric"
          autoComplete="postal-code"
          placeholder="560001"
          value={draft.address.pincode}
          error={errors.pincode}
          onChange={(v) => setAddress({ pincode: v.replace(/\D/g, "").slice(0, 6) })}
        />
        <Field
          label="Address line 1"
          id="line1"
          autoComplete="address-line1"
          placeholder="House / flat, street"
          value={draft.address.line1}
          error={errors.line1}
          onChange={(v) => setAddress({ line1: v })}
        />
        <Field
          label="Address line 2 (optional)"
          id="line2"
          autoComplete="address-line2"
          placeholder="Landmark, area"
          value={draft.address.line2}
          onChange={(v) => setAddress({ line2: v })}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="City"
            id="city"
            autoComplete="address-level2"
            value={draft.address.city}
            error={errors.city}
            onChange={(v) => setAddress({ city: v })}
          />
          <Field
            label="State"
            id="state"
            autoComplete="address-level1"
            value={draft.address.state}
            error={errors.state}
            onChange={(v) => setAddress({ state: v })}
          />
        </div>
      </div>

      <NavRow onBack={onBack} onNext={validateAndNext} />
    </div>
  );
}
