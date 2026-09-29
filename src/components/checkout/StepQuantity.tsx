"use client";

import { useRef, useState, type PointerEvent } from "react";
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
        <ColorwaySlider
          key={colorway.id}
          label={productNameForColorway(colorway.id)}
          slides={[
            {
              src: colorway.productSrc,
              alt: `${colorway.name} edition tab`,
            },
            {
              src: colorway.imageSrc,
              alt: `${colorway.name} edition box`,
            },
          ]}
        />
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
