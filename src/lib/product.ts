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
  imageSrc: "/assets/hero-box-4.png",
} as const;

export const COLORWAYS = [
  {
    id: "barbie",
    name: "Barbie",
    index: 1,
    swatch: "#F5A0C5",
    imageSrc: "/assets/hero-box-4.png",
  },
  {
    id: "traveller",
    name: "Traveller",
    index: 2,
    swatch: "#FFE600",
    imageSrc: "/assets/hero-box-1.png",
  },
  {
    id: "beard",
    name: "Beard",
    index: 3,
    swatch: "#243D80",
    imageSrc: "/assets/hero-box-3.png",
  },
  {
    id: "peace",
    name: "Peace",
    index: 4,
    swatch: "#FFFFFF",
    imageSrc: "/assets/hero-box-2.png",
  },
] as const;

export type ColorwayId = (typeof COLORWAYS)[number]["id"];

export const DEFAULT_COLORWAY: ColorwayId = "barbie";

export function isColorwayId(value: unknown): value is ColorwayId {
  return COLORWAYS.some((colorway) => colorway.id === value);
}

export function getColorway(id: unknown) {
  return COLORWAYS.find((colorway) => colorway.id === id) ?? COLORWAYS[0];
}

export function productNameForColorway(id: unknown): string {
  return `${getColorway(id).name} Edition`;
}

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
