import {
  doc,
  increment,
  onSnapshot,
  setDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirebaseDb, isFirebaseConfigured } from "@/lib/firebase";
import {
  COLORWAYS,
  normalizeCartLines,
  type ColorwayId,
} from "@/lib/product";
import type { OrderRecord } from "@/lib/orders-db";

export const ANALYTICS_COLLECTION = "analytics";
export const BUTTON_CLICKS_DOC = "buttonClicks";

export const TRACKED_BUTTONS = [
  { id: "hero_buy_now", label: "Hero — Buy Now" },
  { id: "header_buy_now", label: "Header — Buy Now" },
  { id: "edition_barbie", label: "Edition — Barbie" },
  { id: "edition_traveller", label: "Edition — Traveller" },
  { id: "edition_beard", label: "Edition — Beard" },
  { id: "edition_peace", label: "Edition — Peace" },
  { id: "nav_product", label: "Nav — Product" },
  { id: "nav_how_to_use", label: "Nav — How to use" },
  { id: "nav_track_order", label: "Nav — Track order" },
  { id: "checkout_continue_quantity", label: "Checkout — Continue (Quantity)" },
  { id: "checkout_continue_contact", label: "Checkout — Continue (Contact)" },
  { id: "checkout_continue_address", label: "Checkout — Continue (Address)" },
  { id: "checkout_continue_summary", label: "Checkout — Continue (Summary)" },
  { id: "checkout_place_order", label: "Checkout — Place / Pay" },
] as const;

export type TrackedButtonId = (typeof TRACKED_BUTTONS)[number]["id"];

export type ButtonClickCounts = Partial<Record<TrackedButtonId, number>>;

export type EditionOrderStat = {
  colorway: ColorwayId;
  name: string;
  swatch: string;
  units: number;
  orders: number;
  revenuePaise: number;
};

const TRACKED_IDS = new Set<string>(TRACKED_BUTTONS.map((b) => b.id));

export function isTrackedButtonId(value: string): value is TrackedButtonId {
  return TRACKED_IDS.has(value);
}

/** Fire-and-forget click increment. Safe to call from UI; never throws to caller. */
export function trackButtonClick(buttonId: TrackedButtonId): void {
  if (!isFirebaseConfigured()) return;

  void (async () => {
    try {
      const ref = doc(
        getFirebaseDb(),
        ANALYTICS_COLLECTION,
        BUTTON_CLICKS_DOC,
      );
      await setDoc(
        ref,
        {
          counts: { [buttonId]: increment(1) },
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
    } catch {
      // Analytics must never break storefront UX.
    }
  })();
}

export function subscribeButtonClicks(
  onData: (counts: ButtonClickCounts) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  if (!isFirebaseConfigured()) {
    onError(new Error("Firebase is not configured"));
    return () => {};
  }

  const ref = doc(getFirebaseDb(), ANALYTICS_COLLECTION, BUTTON_CLICKS_DOC);
  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        onData({});
        return;
      }
      const raw = snap.data()?.counts;
      const counts: ButtonClickCounts = {};
      if (raw && typeof raw === "object") {
        for (const [key, value] of Object.entries(raw)) {
          if (!isTrackedButtonId(key)) continue;
          const n = Number(value);
          if (Number.isFinite(n) && n >= 0) counts[key] = n;
        }
      }
      onData(counts);
    },
    (err) => onError(err instanceof Error ? err : new Error(String(err))),
  );
}

/** Aggregate edition popularity from order line items. */
export function aggregateEditionStats(
  orders: readonly OrderRecord[],
): EditionOrderStat[] {
  const byId = new Map<
    ColorwayId,
    { units: number; orders: number; revenuePaise: number }
  >();

  for (const colorway of COLORWAYS) {
    byId.set(colorway.id, { units: 0, orders: 0, revenuePaise: 0 });
  }

  for (const order of orders) {
    if (order.orderStatus === "cancelled") continue;

    const lines = normalizeCartLines(
      order.lines,
      order.colorway,
      order.quantity,
    );
    if (lines.length === 0) continue;

    const totalQty = lines.reduce((sum, line) => sum + line.quantity, 0);
    const unitRevenue =
      totalQty > 0 ? Math.round(order.amountPaise / totalQty) : 0;

    const seen = new Set<ColorwayId>();
    for (const line of lines) {
      const bucket = byId.get(line.colorway);
      if (!bucket) continue;
      bucket.units += line.quantity;
      bucket.revenuePaise += unitRevenue * line.quantity;
      seen.add(line.colorway);
    }
    for (const id of seen) {
      const bucket = byId.get(id);
      if (bucket) bucket.orders += 1;
    }
  }

  return COLORWAYS.map((colorway) => {
    const bucket = byId.get(colorway.id)!;
    return {
      colorway: colorway.id,
      name: colorway.name,
      swatch: colorway.swatch,
      units: bucket.units,
      orders: bucket.orders,
      revenuePaise: bucket.revenuePaise,
    };
  }).sort((a, b) => b.units - a.units || b.orders - a.orders);
}
