"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { trackButtonClick, type TrackedButtonId } from "@/lib/analytics";
import { CHECKOUT_PATH } from "@/lib/buy";
import type { ColorwayId } from "@/lib/product";

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
  const href = edition
    ? `${CHECKOUT_PATH}?edition=${encodeURIComponent(edition)}`
    : CHECKOUT_PATH;

  return (
    <Link
      href={href}
      className={className}
      onClick={() => trackButtonClick(trackId)}
    >
      {children}
    </Link>
  );
}
