"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { CHECKOUT_PATH } from "@/lib/buy";

type BuyNowButtonProps = {
  className?: string;
  children?: ReactNode;
};

export function BuyNowButton({
  className,
  children = "Buy Now",
}: BuyNowButtonProps) {
  return (
    <Link href={CHECKOUT_PATH} className={className}>
      {children}
    </Link>
  );
}
