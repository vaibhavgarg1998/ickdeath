import type { CheckoutDraft, PlacedOrder } from "@/lib/orders";
import { DEFAULT_COLORWAY, isColorwayId } from "@/lib/product";

const DRAFT_KEY = "ickdeath_checkout_draft";
const ORDER_KEY = "ickdeath_last_order";

const draftListeners = new Set<() => void>();
const orderListeners = new Set<() => void>();

export function emptyDraft(): CheckoutDraft {
  return {
    quantity: 1,
    colorway: DEFAULT_COLORWAY,
    contact: { name: "", phone: "", email: "" },
    address: { line1: "", line2: "", pincode: "", city: "", state: "" },
  };
}

const SERVER_DRAFT = emptyDraft();

function normalizeDraft(draft: CheckoutDraft): CheckoutDraft {
  return {
    ...draft,
    colorway: isColorwayId(draft.colorway) ? draft.colorway : DEFAULT_COLORWAY,
  };
}

let draftCacheRaw: string | null | undefined = undefined;
let draftCacheValue: CheckoutDraft = SERVER_DRAFT;

let orderCacheRaw: string | null | undefined = undefined;
let orderCacheValue: PlacedOrder | null = null;

function readDraft(): CheckoutDraft {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (raw === draftCacheRaw) return draftCacheValue;
    draftCacheRaw = raw;
    draftCacheValue = raw
      ? normalizeDraft({ ...emptyDraft(), ...JSON.parse(raw) })
      : emptyDraft();
    return draftCacheValue;
  } catch {
    return emptyDraft();
  }
}

function readOrder(): PlacedOrder | null {
  try {
    const raw = sessionStorage.getItem(ORDER_KEY);
    if (raw === orderCacheRaw) return orderCacheValue;
    orderCacheRaw = raw;
    orderCacheValue = raw ? (JSON.parse(raw) as PlacedOrder) : null;
    return orderCacheValue;
  } catch {
    return null;
  }
}

export function subscribeCheckoutDraft(onStoreChange: () => void) {
  draftListeners.add(onStoreChange);
  return () => {
    draftListeners.delete(onStoreChange);
  };
}

export function getCheckoutDraftSnapshot(): CheckoutDraft {
  return readDraft();
}

export function getCheckoutDraftServerSnapshot(): CheckoutDraft {
  return SERVER_DRAFT;
}

export function saveCheckoutDraft(draft: CheckoutDraft): void {
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  draftCacheRaw = undefined;
  draftListeners.forEach((l) => l());
}

export function clearCheckoutDraft(): void {
  sessionStorage.removeItem(DRAFT_KEY);
  draftCacheRaw = undefined;
  draftListeners.forEach((l) => l());
}

export function subscribePlacedOrder(onStoreChange: () => void) {
  orderListeners.add(onStoreChange);
  return () => {
    orderListeners.delete(onStoreChange);
  };
}

export function getPlacedOrderSnapshot(): PlacedOrder | null {
  return readOrder();
}

export function getPlacedOrderServerSnapshot(): PlacedOrder | null {
  return null;
}

export function savePlacedOrder(order: PlacedOrder): void {
  sessionStorage.setItem(ORDER_KEY, JSON.stringify(order));
  orderCacheRaw = undefined;
  orderListeners.forEach((l) => l());
}
