import { PRODUCT, cartTotalPaise, cartTotalQty, type CartLine } from "@/lib/product";

const PIXEL_ID = "2318506675660316";
const rawId = process.env.NEXT_PUBLIC_META_PIXEL_ID || PIXEL_ID;

/** Numeric Meta Pixel id from the Events Manager snippet. */
export const META_PIXEL_ID = /^\d{8,20}$/.test(rawId) ? rawId : PIXEL_ID;

type MetaParams = Record<string, string | number | string[]>;

type Fbq = {
  (command: "init", pixelId: string): void;
  (
    command: "track",
    event: string,
    params?: MetaParams,
    options?: { eventID: string },
  ): void;
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[];
  loaded: boolean;
  version: string;
  push: Fbq;
};

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

function whenFbq(send: () => void): void {
  if (!META_PIXEL_ID || typeof window === "undefined") return;
  if (typeof window.fbq === "function") {
    send();
    return;
  }

  let tries = 0;
  const timer = window.setInterval(() => {
    tries += 1;
    if (typeof window.fbq === "function") {
      window.clearInterval(timer);
      send();
    } else if (tries >= 40) {
      window.clearInterval(timer);
    }
  }, 250);
}

export function trackMeta(
  event: string,
  params?: MetaParams,
  eventId?: string,
): void {
  whenFbq(() => {
    if (eventId) {
      window.fbq!("track", event, params, { eventID: eventId });
      return;
    }
    window.fbq!("track", event, params);
  });
}

let lastPath = "";

export function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

/** PageView, plus ViewContent on the product page. Skips a strict-mode double fire. */
export function trackMetaPage(pathname: string): void {
  if (!META_PIXEL_ID) return;
  if (isAdminPath(pathname)) {
    lastPath = "";
    return;
  }
  if (lastPath === pathname) return;
  const firstView = lastPath === "";
  lastPath = pathname;
  // The base snippet already sends the first PageView.
  if (!firstView) trackMeta("PageView");

  if (pathname === "/") {
    trackMeta("ViewContent", {
      content_name: PRODUCT.shortName,
      content_ids: [PRODUCT.id],
      content_type: "product",
      value: PRODUCT.unitPricePaise / 100,
      currency: PRODUCT.currency,
    });
  }
}

let checkoutTrackedAt = 0;

export function trackMetaInitiateCheckout(lines: readonly CartLine[]): void {
  if (!META_PIXEL_ID) return;
  const now = Date.now();
  if (now - checkoutTrackedAt < 1000) return;
  checkoutTrackedAt = now;

  const selected = lines.filter((line) => line.quantity > 0);
  trackMeta("InitiateCheckout", {
    content_name: PRODUCT.shortName,
    content_ids: selected.map((line) => line.colorway),
    content_type: "product",
    value: cartTotalPaise(lines) / 100,
    currency: PRODUCT.currency,
    num_items: cartTotalQty(lines),
  });
}

const purchaseQueued = new Set<string>();

export function trackMetaPurchase(order: {
  orderId: string;
  amountPaise: number;
  lines: readonly CartLine[];
}): void {
  if (!META_PIXEL_ID || typeof window === "undefined") return;
  if (purchaseQueued.has(order.orderId)) return;

  const key = `ickdeath-meta-purchase:${order.orderId}`;
  try {
    if (sessionStorage.getItem(key) === "1") return;
  } catch {
    // Private mode can block storage. The in-memory set still blocks a double fire.
  }

  purchaseQueued.add(order.orderId);
  const selected = order.lines.filter((line) => line.quantity > 0);
  trackMeta(
    "Purchase",
    {
      value: order.amountPaise / 100,
      currency: PRODUCT.currency,
      content_ids: selected.map((line) => line.colorway),
      content_type: "product",
      num_items: selected.reduce((sum, line) => sum + line.quantity, 0),
    },
    order.orderId,
  );

  whenFbq(() => {
    try {
      sessionStorage.setItem(key, "1");
    } catch {
      // Already counted in this tab.
    }
  });
}
