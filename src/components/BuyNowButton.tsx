"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AssetImage } from "@/components/AssetImage";
import { trackButtonClick, type TrackedButtonId } from "@/lib/analytics";
import { AMAZON_URL, CHECKOUT_PATH } from "@/lib/buy";
import { COLORWAYS, type ColorwayId } from "@/lib/product";

type BuyNowButtonProps = {
  className?: string;
  children?: ReactNode;
  edition?: ColorwayId;
  trackId: TrackedButtonId;
};

export function BuyNowButton({
  className,
  children = "Buy Now",
  edition,
  trackId,
}: BuyNowButtonProps) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const editionName = edition
    ? COLORWAYS.find((colorway) => colorway.id === edition)?.name
    : undefined;
  const checkoutHref = edition
    ? `${CHECKOUT_PATH}?edition=${encodeURIComponent(edition)}`
    : CHECKOUT_PATH;

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => {
          trackButtonClick(trackId);
          setOpen(true);
        }}
      >
        {children}
      </button>
      {open
        ? createPortal(
            <BuyNowDialog
              titleId={titleId}
              editionName={editionName}
              checkoutHref={checkoutHref}
              onClose={() => setOpen(false)}
            />,
            document.body,
          )
        : null}
    </>
  );
}

function BuyNowDialog({
  titleId,
  editionName,
  checkoutHref,
  onClose,
}: {
  titleId: string;
  editionName?: string;
  checkoutHref: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-black/75"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-md rounded-3xl border-2 border-neon bg-bg-elevated p-5 shadow-[0_0_40px_rgba(193,239,4,0.12)] sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id={titleId}
              className="font-[family-name:var(--font-bebas)] text-4xl leading-none tracking-wide text-white sm:text-5xl"
            >
              BUY NOW
            </h2>
            <p className="mt-2 font-[family-name:var(--font-ibm-plex)] text-sm leading-relaxed text-text-dim">
              Order on this site, or on Amazon.
              {editionName ? ` Website checkout starts with ${editionName}.` : ""}
            </p>
          </div>
          <button
            type="button"
            className="inline-flex size-10 shrink-0 items-center justify-center border border-white/15 text-white transition-colors hover:border-neon hover:text-neon"
            aria-label="Close"
            onClick={onClose}
          >
            <span aria-hidden className="text-xl leading-none">
              ×
            </span>
          </button>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <Link
            href={checkoutHref}
            className="inline-flex h-14 items-center justify-center bg-neon px-5 font-[family-name:var(--font-anton)] text-base uppercase tracking-[0.08em] text-bg transition-opacity hover:opacity-90"
          >
            Buy on ickdeath.com
          </Link>
          <a
            href={AMAZON_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackButtonClick("buy_amazon")}
            className="inline-flex h-14 items-center justify-center gap-3 border border-white/20 px-5 font-[family-name:var(--font-anton)] text-base uppercase tracking-[0.08em] text-white transition-colors hover:border-neon hover:text-neon"
          >
            <AssetImage
              src="/assets/icon-amazon.svg"
              alt=""
              width={28}
              height={28}
              className="size-7 object-contain"
            />
            Buy on Amazon
          </a>
        </div>
      </div>
    </div>
  );
}
