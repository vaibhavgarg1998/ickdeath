"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { CHECKOUT_PATH } from "@/lib/buy";
import type { ColorwayId } from "@/lib/product";

type BuyNowButtonProps = {
  className?: string;
  children?: ReactNode;
  edition?: ColorwayId;
};

export function BuyNowButton({
  className,
  children = "Buy Now",
  edition,
}: BuyNowButtonProps) {
  const href = edition
    ? `${CHECKOUT_PATH}?edition=${encodeURIComponent(edition)}`
    : CHECKOUT_PATH;

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
