"use client";

import type { ReactNode } from "react";
import type { CheckoutDraft } from "@/lib/orders";
import { formatINR, lineTotalPaise, productNameForColorway } from "@/lib/product";
import { NavRow } from "@/components/checkout/form-ui";

type Props = {
  draft: CheckoutDraft;
  onBack: () => void;
  onNext: () => void;
};

export function StepSummary({ draft, onBack, onNext }: Props) {
  const total = lineTotalPaise(draft.quantity);
  const addr = draft.address;

  return (
    <div>
      <h2 className="font-[family-name:var(--font-bebas)] text-3xl tracking-wide text-white sm:text-4xl">
        Order summary
      </h2>
      <p className="mt-2 font-[family-name:var(--font-ibm-plex)] text-sm text-text-dim">
        Confirm details before payment.
      </p>

      <dl className="mt-6 space-y-4 font-[family-name:var(--font-ibm-plex)] text-sm">
        <Row label="Product">
          {productNameForColorway(draft.colorway)} × {draft.quantity}
        </Row>
        <Row label="Contact">
          {draft.contact.name}
          <br />
          +91 {draft.contact.phone}
          {draft.contact.email ? (
            <>
              <br />
              {draft.contact.email}
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
        <Row label="Subtotal">
          <span className="text-neon">{formatINR(total)}</span>
        </Row>
        <Row label="Shipping">
          <span className="text-text-dim">Calculated at dispatch (WhatsApp)</span>
        </Row>
      </dl>

      <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-5">
        <div>
          <p className="font-[family-name:var(--font-ibm-plex)] text-xs uppercase tracking-wider text-text-dim">
            Total due
          </p>
          <p className="font-[family-name:var(--font-bebas)] text-3xl text-neon">
            {formatINR(total)}
          </p>
        </div>
      </div>

      <NavRow onBack={onBack} onNext={onNext} nextLabel="Continue to payment" />
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1 border-b border-white/5 pb-4 sm:grid-cols-[120px_1fr]">
      <dt className="text-text-dim">{label}</dt>
      <dd className="text-text-soft">{children}</dd>
    </div>
  );
}
