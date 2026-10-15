"use client";

import { useRef, useState, type PointerEvent } from "react";
import { AssetImage } from "@/components/AssetImage";
import type { CartLine, CheckoutDraft } from "@/lib/orders";
import { PriceBreakdownPanel } from "@/components/checkout/form-ui";
import {
  cartTotalQty,
  COLORWAYS,
  formatINR,
  getColorway,
  PRODUCT,
  productNameForColorway,
  type ColorwayId,
} from "@/lib/product";

type Props = {
  draft: CheckoutDraft;
  onChange: (draft: CheckoutDraft) => void;
  onNext: () => void;
};

function qtyForColorway(lines: readonly CartLine[], id: ColorwayId): number {
  return lines.find((line) => line.colorway === id)?.quantity ?? 0;
}

function withLineQty(
  lines: readonly CartLine[],
  id: ColorwayId,
  quantity: number,
): CartLine[] {
  const next = lines.filter((line) => line.colorway !== id);
  if (quantity > 0) next.push({ colorway: id, quantity });
  return COLORWAYS.flatMap((colorway) => {
    const line = next.find((entry) => entry.colorway === colorway.id);
    return line ? [line] : [];
  });
}

function cartSummary(lines: readonly CartLine[]): string {
  return lines
    .filter((line) => line.quantity > 0)
    .map((line) => {
      const name = productNameForColorway(line.colorway);
      // Match design: "1x Barbie edition."
      return `${line.quantity}x ${name.replace(/ Edition$/i, " edition")}.`;
    })
    .join(" ");
}

export function StepQuantity({ draft, onChange, onNext }: Props) {
  const lines = draft.lines;
  const totalQty = cartTotalQty(lines);
  const focused = getColorway(draft.colorway);
  const focusedQty = qtyForColorway(lines, focused.id);
  const others = totalQty - focusedQty;
  const maxForFocused = Math.max(0, PRODUCT.maxQty - others);
  const canContinue = totalQty >= PRODUCT.minQty;

  function commit(nextLines: CartLine[], colorway: ColorwayId) {
    onChange({
      ...draft,
      lines: nextLines,
      quantity: cartTotalQty(nextLines),
      colorway,
    });
  }

  /** Preview only — quantity changes solely via +/-. */
  function selectColorway(id: ColorwayId) {
    onChange({ ...draft, colorway: id });
  }

  function bumpFocused(delta: number) {
    const nextQty = focusedQty + delta;
    const clamped = Math.min(maxForFocused, Math.max(0, nextQty));
    commit(withLineQty(lines, focused.id, clamped), focused.id);
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <h2 className="flex items-center gap-3 font-[family-name:var(--font-bebas)] text-3xl tracking-wide text-white sm:text-4xl">
          <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-neon text-sm font-bold text-bg sm:size-9 sm:text-base">
            01
          </span>
          PRODUCT / QUANTITY
        </h2>
      </div>

      <p className="mt-6 flex items-center gap-2 font-[family-name:var(--font-ibm-plex)] text-[10px] uppercase tracking-[0.18em] text-text-dim">
        <span className="inline-block h-px w-4 bg-neon" aria-hidden />
        Selected pack
      </p>

      <div className="mt-3 flex gap-4 sm:gap-5">
        <ColorwaySlider
          key={focused.id}
          label={productNameForColorway(focused.id)}
          slides={[
            {
              src: focused.imageSrc,
              alt: `${focused.name} edition box`,
            },
            {
              src: focused.productSrc,
              alt: `${focused.name} edition tab`,
            },
          ]}
        />
        <div className="min-w-0 flex-1">
          <p className="font-[family-name:var(--font-ibm-plex)] text-[10px] uppercase tracking-[0.18em] text-text-dim">
            Limited edition / {String(focused.index).padStart(2, "0")}
          </p>
          <p className="mt-1 inline-block border-b border-white/35 pb-0.5 font-[family-name:var(--font-bebas)] text-3xl tracking-wide text-white sm:text-4xl">
            {productNameForColorway(focused.id).toUpperCase()}
          </p>
          <p className="mt-2 font-[family-name:var(--font-ibm-plex)] text-xs text-text-dim">
            {PRODUCT.description}
          </p>
          <p className="mt-2 font-[family-name:var(--font-ibm-plex)] text-sm text-white">
            {formatINR(PRODUCT.unitPricePaise)} each
            <span className="text-text-dim">
              {" "}
              + {formatINR(PRODUCT.deliveryPaisePerUnit)} delivery
            </span>
          </p>

          <p className="mt-4 font-[family-name:var(--font-ibm-plex)] text-[10px] uppercase tracking-[0.18em] text-text-dim">
            Colorway
          </p>
          <div className="mt-2 flex items-center gap-2.5">
            {COLORWAYS.map((option) => {
              const selected = option.id === focused.id;
              const inCart = qtyForColorway(lines, option.id) > 0;
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-label={`${option.name} edition${inCart ? `, ${qtyForColorway(lines, option.id)} in cart` : ""}`}
                  aria-pressed={selected}
                  onClick={() => selectColorway(option.id)}
                  className={`size-6 rounded-full border-2 transition-transform ${
                    selected
                      ? "scale-110 border-neon"
                      : inCart
                        ? "border-white/55 hover:border-neon/70"
                        : "border-white/20 hover:border-white/50"
                  }`}
                  style={{ backgroundColor: option.swatch }}
                />
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-8 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-[family-name:var(--font-ibm-plex)] text-sm text-text-soft">
            Quantity
          </p>
          <p className="mt-0.5 font-[family-name:var(--font-ibm-plex)] text-xs text-text-dim">
            Choose how many packs you want.
          </p>
          {lines.length > 0 ? (
            <p className="mt-2 font-[family-name:var(--font-ibm-plex)] text-xs text-white">
              {cartSummary(lines)}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            aria-label={`Decrease ${focused.name} quantity`}
            className="inline-flex size-10 items-center justify-center rounded-md border border-neon/50 text-neon transition-opacity hover:opacity-80 disabled:opacity-40"
            disabled={focusedQty <= 0}
            onClick={() => bumpFocused(-1)}
          >
            −
          </button>
          <span className="min-w-[2ch] text-center font-[family-name:var(--font-bebas)] text-3xl text-white">
            {focusedQty}
          </span>
          <button
            type="button"
            aria-label={`Increase ${focused.name} quantity`}
            className="inline-flex size-10 items-center justify-center rounded-md bg-neon text-bg transition-opacity hover:opacity-90 disabled:opacity-40"
            disabled={focusedQty >= maxForFocused}
            onClick={() => bumpFocused(1)}
          >
            +
          </button>
        </div>
      </div>

      <PriceBreakdownPanel
        quantity={cartTotalQty(lines)}
        className="mt-6 border-t border-white/10 pt-5"
      />

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={onNext}
          disabled={!canContinue}
          className="inline-flex h-12 items-center bg-neon px-6 font-[family-name:var(--font-anton)] text-sm uppercase tracking-[0.14em] text-bg transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

type Slide = {
  src: string;
  alt: string;
};

function ColorwaySlider({
  slides,
  label,
}: {
  slides: readonly Slide[];
  label: string;
}) {
  const [index, setIndex] = useState(0);
  const startX = useRef<number | null>(null);
  const count = slides.length;

  function go(next: number) {
    setIndex((next + count) % count);
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    startX.current = event.clientX;
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    if (startX.current == null) return;
    const delta = event.clientX - startX.current;
    startX.current = null;
    if (delta > 40) go(index - 1);
    else if (delta < -40) go(index + 1);
  }

  return (
    <div
      className="relative aspect-[2/3] w-32 shrink-0 overflow-hidden bg-bg-stage sm:w-36"
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        startX.current = null;
      }}
    >
      {slides.map((slide, i) => (
        <div
          key={slide.src}
          className="absolute inset-0 transition-transform duration-300 ease-out"
          style={{ transform: `translateX(${(i - index) * 100}%)` }}
          aria-hidden={i !== index}
        >
          <AssetImage
            src={slide.src}
            alt={i === index ? slide.alt : ""}
            fill
            priority
            sizes="144px"
            className="object-cover"
          />
        </div>
      ))}

      <button
        type="button"
        aria-label="Previous image"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={() => go(index - 1)}
        className="absolute left-1 top-1/2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-sm leading-none text-white"
      >
        ‹
      </button>
      <button
        type="button"
        aria-label="Next image"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={() => go(index + 1)}
        className="absolute right-1 top-1/2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-sm leading-none text-white"
      >
        ›
      </button>

      <div className="absolute inset-x-0 bottom-1.5 flex justify-center gap-1.5">
        {slides.map((slide, i) => (
          <button
            key={slide.src}
            type="button"
            aria-label={slide.alt}
            aria-current={i === index ? "true" : undefined}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => setIndex(i)}
            className={`size-1.5 rounded-full ${
              i === index ? "bg-neon" : "bg-white/55"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
