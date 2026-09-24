"use client";

import { AssetImage } from "@/components/AssetImage";
import type { CheckoutDraft } from "@/lib/orders";
import {
  COLORWAYS,
  formatINR,
  getColorway,
  lineTotalPaise,
  PRODUCT,
  productNameForColorway,
  type ColorwayId,
} from "@/lib/product";

type Props = {
  draft: CheckoutDraft;
  onChange: (draft: CheckoutDraft) => void;
  onNext: () => void;
};

export function StepQuantity({ draft, onChange, onNext }: Props) {
  const qty = draft.quantity;
  const colorway = getColorway(draft.colorway);

  function setQty(next: number) {
    const clamped = Math.min(
      PRODUCT.maxQty,
      Math.max(PRODUCT.minQty, next),
    );
    onChange({ ...draft, quantity: clamped });
  }

  function setColorway(id: ColorwayId) {
    onChange({ ...draft, colorway: id });
  }

  return (
    <div>
      <h2 className="font-[family-name:var(--font-bebas)] text-3xl tracking-wide text-white sm:text-4xl">
        Product / quantity
      </h2>
      <p className="mt-2 font-[family-name:var(--font-ibm-plex)] text-sm text-text-dim">
        Pick a colorway and how many packs you want.
      </p>

      <p className="mt-6 font-[family-name:var(--font-ibm-plex)] text-[10px] uppercase tracking-[0.18em] text-text-dim">
        Selected pack
      </p>

      <div className="mt-3 flex gap-4 sm:gap-5">
        <div
          className="relative h-36 w-24 shrink-0 overflow-hidden bg-bg-stage sm:h-44 sm:w-28"
          role="img"
          aria-label={productNameForColorway(colorway.id)}
        >
          {COLORWAYS.map((option) => (
            <AssetImage
              key={option.id}
              src={option.imageSrc}
              alt=""
              fill
              priority
              sizes="112px"
              className={`object-contain p-1 ${
                option.id === colorway.id ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
            />
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-[family-name:var(--font-ibm-plex)] text-[10px] uppercase tracking-[0.18em] text-text-dim">
            Limited edition / {String(colorway.index).padStart(2, "0")}
          </p>
          <p className="mt-1 font-[family-name:var(--font-bebas)] text-3xl tracking-wide text-white sm:text-4xl">
            {productNameForColorway(colorway.id)}
          </p>
          <p className="mt-1 font-[family-name:var(--font-ibm-plex)] text-xs text-text-dim">
            {PRODUCT.description}
          </p>
          <p className="mt-2 font-[family-name:var(--font-ibm-plex)] text-sm text-white">
            {formatINR(PRODUCT.unitPricePaise)} each
          </p>

          <p className="mt-4 font-[family-name:var(--font-ibm-plex)] text-[10px] uppercase tracking-[0.18em] text-text-dim">
            Colorway
          </p>
          <div className="mt-2 flex items-center gap-2.5">
            {COLORWAYS.map((option) => {
              const selected = option.id === colorway.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-label={`${option.name} edition`}
                  aria-pressed={selected}
                  onClick={() => setColorway(option.id)}
                  className={`size-6 rounded-full border-2 transition-transform ${
                    selected
                      ? "scale-110 border-neon"
                      : "border-white/20 hover:border-white/50"
                  }`}
                  style={{ backgroundColor: option.swatch }}
                />
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <div>
          <p className="font-[family-name:var(--font-ibm-plex)] text-sm text-text-soft">
            Quantity
          </p>
          <p className="mt-0.5 font-[family-name:var(--font-ibm-plex)] text-xs text-text-dim">
            Choose how many packs you want.
          </p>
        </div>
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
            className="inline-flex size-10 items-center justify-center rounded-lg border border-neon/50 text-neon transition-opacity hover:opacity-90 disabled:opacity-40"
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
