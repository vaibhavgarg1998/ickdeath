"use client";

import { AssetImage } from "@/components/AssetImage";
import type { CheckoutDraft } from "@/lib/orders";
import { formatINR, lineTotalPaise, PRODUCT } from "@/lib/product";

type Props = {
  draft: CheckoutDraft;
  onChange: (draft: CheckoutDraft) => void;
  onNext: () => void;
};

export function StepQuantity({ draft, onChange, onNext }: Props) {
  const qty = draft.quantity;

  function setQty(next: number) {
    const clamped = Math.min(
      PRODUCT.maxQty,
      Math.max(PRODUCT.minQty, next),
    );
    onChange({ ...draft, quantity: clamped });
  }

  return (
    <div>
      <h2 className="font-[family-name:var(--font-bebas)] text-3xl tracking-wide text-white sm:text-4xl">
        Product &amp; quantity
      </h2>
      <p className="mt-2 font-[family-name:var(--font-ibm-plex)] text-sm text-text-dim">
        Choose how many packs you want. Total updates before you enter details.
      </p>

      <div className="mt-6 flex gap-4 rounded-xl border border-white/10 bg-bg p-4">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-bg-stage sm:size-24">
          <AssetImage
            src={PRODUCT.imageSrc}
            alt={PRODUCT.name}
            fill
            className="object-contain p-1"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-[family-name:var(--font-anton)] text-lg uppercase tracking-wide text-neon">
            {PRODUCT.name}
          </p>
          <p className="mt-1 font-[family-name:var(--font-ibm-plex)] text-xs text-text-dim">
            {PRODUCT.description}
          </p>
          <p className="mt-2 font-[family-name:var(--font-ibm-plex)] text-sm text-white">
            {formatINR(PRODUCT.unitPricePaise)} each
          </p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <span className="font-[family-name:var(--font-ibm-plex)] text-sm text-text-soft">
          Quantity
        </span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Decrease quantity"
            className="inline-flex size-10 items-center justify-center rounded-lg border border-neon/50 text-neon transition-opacity hover:opacity-80 disabled:opacity-40"
            disabled={qty <= PRODUCT.minQty}
            onClick={() => setQty(qty - 1)}
          >
            −
          </button>
          <span className="min-w-[2ch] text-center font-[family-name:var(--font-bebas)] text-3xl text-white">
            {qty}
          </span>
          <button
            type="button"
            aria-label="Increase quantity"
            className="inline-flex size-10 items-center justify-center rounded-lg border border-neon/50 text-neon transition-opacity hover:opacity-80 disabled:opacity-40"
            disabled={qty >= PRODUCT.maxQty}
            onClick={() => setQty(qty + 1)}
          >
            +
          </button>
        </div>
      </div>

      <div className="mt-6 flex items-end justify-between border-t border-white/10 pt-5">
        <div>
          <p className="font-[family-name:var(--font-ibm-plex)] text-xs uppercase tracking-wider text-text-dim">
            Subtotal
          </p>
          <p className="font-[family-name:var(--font-bebas)] text-3xl text-neon">
            {formatINR(lineTotalPaise(qty))}
          </p>
        </div>
        <button
          type="button"
          onClick={onNext}
          className="inline-flex h-12 items-center bg-neon px-6 font-[family-name:var(--font-anton)] text-sm uppercase tracking-[0.14em] text-bg transition-opacity hover:opacity-90"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
