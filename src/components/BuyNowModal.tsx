"use client";

import { AssetImage } from "@/components/AssetImage";
import { AMAZON_URL, FLIPKART_URL } from "@/lib/buy";

type BuyNowModalProps = {
  open: boolean;
  onClose: () => void;
};

/**
 * Amazon button mark: black “amazon” word + provided smile asset.
 */
function AmazonMark() {
  return (
    <span className="relative flex h-full w-full items-center justify-center px-2">
      <AssetImage
        src="/assets/amazon-smile.png"
        alt="Amazon"
        width={178}
        height={75}
        className="h-[34px] w-auto max-w-[92%] object-contain sm:h-[38px]"
        priority
      />
    </span>
  );
}

/**
 * Flipkart mark from user asset (124×47 wordmark).
 */
function FlipkartMark() {
  return (
    <span className="relative flex h-full w-full items-center justify-center px-2">
      <AssetImage
        src="/assets/flipkart-logo.png"
        alt="Flipkart"
        width={124}
        height={47}
        className="h-[28px] w-auto max-w-[92%] object-contain sm:h-[32px]"
        priority
      />
    </span>
  );
}

export function BuyNowModal({ open, onClose }: BuyNowModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="buy-now-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-[rgba(16,16,16,0.8)]"
        aria-label="Close buy dialog"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-[360px] overflow-hidden rounded-[20px] border-[5px] border-[#c1ef04] bg-[#101010] sm:max-w-[400px] sm:rounded-[24px] sm:border-[6px]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3.5 top-3.5 z-20 size-[18px]"
          aria-label="Close"
        >
          <AssetImage
            src="/assets/buy-close.svg"
            alt=""
            width={18}
            height={18}
            className="size-full"
          />
        </button>

        <div className="flex flex-col items-center px-5 pb-8 pt-9 sm:px-7 sm:pb-9 sm:pt-10">
          <div className="relative size-14 shrink-0">
            <AssetImage
              src="/assets/buy-cart.svg"
              alt=""
              width={56}
              height={56}
              className="size-full"
              priority
            />
          </div>

          <h2
            id="buy-now-title"
            className="mt-3 text-center font-[family-name:var(--font-bebas)] text-[3rem] leading-[1.1] tracking-wide text-white [text-shadow:6px_6px_16px_rgba(193,239,4,0.5)] sm:text-[3.5rem]"
          >
            BUY NOW
          </h2>

          <div className="mt-3 h-px w-[min(70%,220px)] bg-white" />

          <p className="mt-4 text-center font-[family-name:var(--font-ibm-plex)] text-base text-white [text-shadow:6px_6px_16px_rgba(193,239,4,0.45)]">
            Available on
          </p>

          {/*
            Figma store pills:
            white / #f7e730, 233×72, radius 12, equal width, logos centered
          */}
          <div className="mt-5 grid w-full max-w-[300px] grid-cols-2 gap-3 sm:max-w-[320px] sm:gap-4">
            <a
              href={AMAZON_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-[52px] items-center justify-center rounded-[12px] bg-white transition-opacity hover:opacity-90 sm:h-[56px]"
              aria-label="Buy on Amazon"
            >
              <AmazonMark />
            </a>

            <a
              href={FLIPKART_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-[52px] items-center justify-center rounded-[12px] bg-[#f7e730] transition-opacity hover:opacity-90 sm:h-[56px]"
              aria-label="Buy on Flipkart"
            >
              <FlipkartMark />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
