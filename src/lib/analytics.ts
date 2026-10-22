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
  { id: "nav_product", label: "Nav — About Us" },
  { id: "nav_contact", label: "Nav — Contact Us" },
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

export type CityOrderStat = {
  city: string;
  state: string;
  orders: number;
  revenuePaise: number;
};

export type RepeatCustomerStat = {
  phone: string;
  name: string;
  orders: number;
  revenuePaise: number;
  lastOrderAt: string;
};

export type RepeatOrderSummary = {
  uniqueCustomers: number;
  repeatCustomers: number;
  repeatOrderCount: number;
  customers: RepeatCustomerStat[];
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

function activeOrders(orders: readonly OrderRecord[]): OrderRecord[] {
  return orders.filter((order) => order.orderStatus !== "cancelled");
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

/** Aggregate order volume by city (+ state for disambiguation). */
export function aggregateCityStats(
  orders: readonly OrderRecord[],
): CityOrderStat[] {
  const byKey = new Map<
    string,
    { city: string; state: string; orders: number; revenuePaise: number }
  >();

  for (const order of activeOrders(orders)) {
    const city = order.address?.city?.trim() || "Unknown";
    const state = order.address?.state?.trim() || "";
    const key = `${city.toLowerCase()}|${state.toLowerCase()}`;
    const bucket = byKey.get(key) ?? {
      city,
      state,
      orders: 0,
      revenuePaise: 0,
    };
    bucket.orders += 1;
    bucket.revenuePaise += order.amountPaise;
    byKey.set(key, bucket);
  }

  return [...byKey.values()].sort(
    (a, b) => b.orders - a.orders || b.revenuePaise - a.revenuePaise,
  );
}

/**
 * Customers with 2+ non-cancelled orders (matched by phone).
 * `repeatOrderCount` = total orders from those customers (not just extras).
 */
export function aggregateRepeatOrders(
  orders: readonly OrderRecord[],
): RepeatOrderSummary {
  const byPhone = new Map<
    string,
    {
      phone: string;
      name: string;
      orders: number;
      revenuePaise: number;
      lastOrderAt: string;
    }
  >();

  for (const order of activeOrders(orders)) {
    const phone = normalizePhone(order.contact?.phone ?? "");
    if (phone.length < 10) continue;

    const createdAt = order.createdAt || "";
    const existing = byPhone.get(phone);
    if (!existing) {
      byPhone.set(phone, {
        phone,
        name: order.contact?.name?.trim() || "Customer",
        orders: 1,
        revenuePaise: order.amountPaise,
        lastOrderAt: createdAt,
      });
      continue;
    }

    existing.orders += 1;
    existing.revenuePaise += order.amountPaise;
    if (order.contact?.name?.trim()) existing.name = order.contact.name.trim();
    if (createdAt > existing.lastOrderAt) existing.lastOrderAt = createdAt;
  }

  const customers = [...byPhone.values()]
    .filter((row) => row.orders >= 2)
    .sort(
      (a, b) =>
        b.orders - a.orders ||
        b.revenuePaise - a.revenuePaise ||
        b.lastOrderAt.localeCompare(a.lastOrderAt),
    );

  return {
    uniqueCustomers: byPhone.size,
    repeatCustomers: customers.length,
    repeatOrderCount: customers.reduce((sum, row) => sum + row.orders, 0),
    customers,
  };
}
