"use client";

import { useState } from "react";
import {
  isValidEmail,
  isValidIndianPhone,
  normalizePhone,
  type CheckoutDraft,
} from "@/lib/orders";
import { Field, NavRow } from "@/components/checkout/form-ui";

type Props = {
  draft: CheckoutDraft;
  onChange: (draft: CheckoutDraft) => void;
  onBack: () => void;
  onNext: () => void;
};

export function StepContact({ draft, onChange, onBack, onNext }: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  function setContact(partial: Partial<CheckoutDraft["contact"]>) {
    onChange({ ...draft, contact: { ...draft.contact, ...partial } });
  }

  function validateAndNext() {
    const next: Record<string, string> = {};
    if (!draft.contact.name.trim()) next.name = "Name is required";
    if (!isValidIndianPhone(draft.contact.phone)) {
      next.phone = "Enter a valid 10-digit WhatsApp number";
    }
    if (!isValidEmail(draft.contact.email)) {
      next.email = "Enter a valid email or leave blank";
    }
    setErrors(next);
    if (Object.keys(next).length) return;

    onChange({
      ...draft,
      contact: {
        ...draft.contact,
        name: draft.contact.name.trim(),
        phone: normalizePhone(draft.contact.phone),
        email: draft.contact.email.trim(),
      },
    });
    onNext();
  }

  return (
    <div>
      <h2 className="font-[family-name:var(--font-bebas)] text-3xl tracking-wide text-white sm:text-4xl">
        Contact info
      </h2>
      <p className="mt-2 font-[family-name:var(--font-ibm-plex)] text-sm text-text-dim">
        We&apos;ll send order updates on WhatsApp to this number.
      </p>

      <div className="mt-6 space-y-4">
        <Field
          label="Full name"
          id="name"
          autoComplete="name"
          value={draft.contact.name}
          error={errors.name}
          onChange={(v) => setContact({ name: v })}
        />
        <Field
          label="WhatsApp number"
          id="phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          placeholder="98XXXXXXXX"
          value={draft.contact.phone}
          error={errors.phone}
          onChange={(v) => setContact({ phone: v })}
        />
        <Field
          label="Email (optional)"
          id="email"
          type="email"
          autoComplete="email"
          placeholder="for payment receipt"
          value={draft.contact.email}
          error={errors.email}
          onChange={(v) => setContact({ email: v })}
        />
      </div>

      <NavRow onBack={onBack} onNext={validateAndNext} />
    </div>
  );
}
