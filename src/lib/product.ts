/** Single SKU sold on the website (guest checkout). Update price when live. */
export const PRODUCT = {
  id: "seat-safe-tabs",
  name: "Seat Safe Tabs",
  shortName: "ICK DEATH Seat Safe Tabs",
  description: "1× Lifter · 2× Alcohol Wipes · 1× Gloves",
  /** Price in INR paise (29900 = ₹299). */
  unitPricePaise: 29900,
  currency: "INR" as const,
  minQty: 1,
  maxQty: 10,
  imageSrc: "/assets/product-open.png",
} as const;

export function formatINR(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(rupees);
}

export function lineTotalPaise(quantity: number): number {
  return PRODUCT.unitPricePaise * quantity;
}
