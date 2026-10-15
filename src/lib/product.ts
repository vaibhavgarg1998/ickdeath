/** Single SKU sold on the website (guest checkout). Update price when live. */
export const PRODUCT = {
  id: "seat-safe-tabs",
  name: "Seat Safe Tabs",
  shortName: "ICK DEATH Seat Safe Tabs",
  description: "1× Lifter · 2× Alcohol Wipes · 1× Gloves",
  /** Inclusive price in INR paise (59900 = ₹599 incl. GST). */
  unitPricePaise: 59900,
  /** GST rate baked into unitPricePaise (18% → base ≈ ₹507.63). */
  gstRatePercent: 18,
  currency: "INR" as const,
  minQty: 1,
  maxQty: 9,
  imageSrc: "/assets/hero-box-4.png",
} as const;

export const COLORWAYS = [
  {
    id: "barbie",
    name: "Barbie",
    index: 1,
    swatch: "#F5A0C5",
    productSrc: "/assets/products/barbie.jpg",
    imageSrc: "/assets/hero-box-4.png",
  },
  {
    id: "traveller",
    name: "Traveller",
    index: 2,
    swatch: "#FFE600",
    productSrc: "/assets/products/traveller.jpg",
    imageSrc: "/assets/hero-box-1.png",
  },
  {
    id: "beard",
    name: "Beard",
    index: 3,
    swatch: "#243D80",
    productSrc: "/assets/products/beard.jpg",
    imageSrc: "/assets/hero-box-3.png",
  },
  {
    id: "peace",
    name: "Peace",
    index: 4,
    swatch: "#FFFFFF",
    productSrc: "/assets/products/peace.jpg",
    imageSrc: "/assets/hero-box-2.png",
  },
] as const;

export type ColorwayId = (typeof COLORWAYS)[number]["id"];

/** One colorway + qty in the cart. Multiple lines = mixed editions. */
export type CartLine = {
  colorway: ColorwayId;
  quantity: number;
};

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

/** Currency with paise — used for GST line items. */
export function formatINRExact(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(paise / 100);
}

export type PriceBreakdown = {
  basePaise: number;
  gstPaise: number;
  totalPaise: number;
};

/** Split an inclusive total into taxable value + GST (sums exactly). */
export function priceBreakdown(totalPaise: number): PriceBreakdown {
  const basePaise = Math.round(
    totalPaise / (1 + PRODUCT.gstRatePercent / 100),
  );
  return {
    basePaise,
    gstPaise: totalPaise - basePaise,
    totalPaise,
  };
}

export function lineTotalPaise(quantity: number): number {
  return PRODUCT.unitPricePaise * quantity;
}

export function cartTotalQty(lines: readonly CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}

export function cartTotalPaise(lines: readonly CartLine[]): number {
  return lineTotalPaise(cartTotalQty(lines));
}

export function formatCartLines(lines: readonly CartLine[]): string {
  return lines
    .filter((line) => line.quantity > 0)
    .map((line) => `${productNameForColorway(line.colorway)} × ${line.quantity}`)
    .join(", ");
}

/** Build a valid cart from stored lines or legacy single colorway + qty. */
export function normalizeCartLines(
  lines: unknown,
  fallbackColorway: unknown = DEFAULT_COLORWAY,
  fallbackQuantity: unknown = 0,
): CartLine[] {
  if (Array.isArray(lines)) {
    const byId = new Map<ColorwayId, number>();
    for (const entry of lines) {
      if (!entry || typeof entry !== "object") continue;
      const raw = entry as { colorway?: unknown; quantity?: unknown };
      if (!isColorwayId(raw.colorway)) continue;
      const qty = Number(raw.quantity);
      if (!Number.isInteger(qty) || qty < 1) continue;
      byId.set(raw.colorway, (byId.get(raw.colorway) ?? 0) + qty);
    }

    let remaining = PRODUCT.maxQty;
    const normalized: CartLine[] = [];
    for (const colorway of COLORWAYS) {
      const qty = byId.get(colorway.id);
      if (!qty) continue;
      const clamped = Math.min(qty, remaining);
      if (clamped < 1) continue;
      normalized.push({ colorway: colorway.id, quantity: clamped });
      remaining -= clamped;
      if (remaining <= 0) break;
    }
    // Explicit lines array (including empty) wins — do not invent qty.
    return normalized;
  }

  const colorway = isColorwayId(fallbackColorway)
    ? fallbackColorway
    : DEFAULT_COLORWAY;
  const qty = Number(fallbackQuantity);
  if (!Number.isInteger(qty) || qty < 1) return [];
  const clamped = Math.min(PRODUCT.maxQty, qty);

  return [{ colorway, quantity: clamped }];
}

export function formatOrderItems(order: {
  lines?: readonly CartLine[] | null;
  colorway?: unknown;
  quantity?: number;
  productName?: string;
}): string {
  if (order.lines && order.lines.length > 0) {
    return formatCartLines(order.lines);
  }
  if (isColorwayId(order.colorway) && order.quantity != null) {
    return `${productNameForColorway(order.colorway)} × ${order.quantity}`;
  }
  if (order.productName) {
    // New writes bake qty into productName; don't append again.
    if (/\s×\s\d+/.test(order.productName)) return order.productName;
    return order.quantity != null && order.quantity > 0
      ? `${order.productName} × ${order.quantity}`
      : order.productName;
  }
  return PRODUCT.name;
}
