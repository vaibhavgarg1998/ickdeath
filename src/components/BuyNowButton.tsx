"use client";

import { useBuyNow } from "@/components/BuyNowProvider";

type BuyNowButtonProps = {
  className?: string;
  children?: React.ReactNode;
};

export function BuyNowButton({
  className,
  children = "Buy Now",
}: BuyNowButtonProps) {
  const { open } = useBuyNow();

  return (
    <button type="button" onClick={open} className={className}>
      {children}
    </button>
  );
}
