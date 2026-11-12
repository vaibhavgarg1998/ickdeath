"use client";

import { getCheckoutDraftSnapshot } from "@/lib/checkout-storage";
import { withBasePath } from "@/lib/paths";
import { PRODUCT, cartTotalPaise, cartTotalQty, productNameForColorway, type CartLine } from "@/lib/product";
import {
  isCustomMetaEvent,
  isStandardMetaEvent,
  sanitizeMetaCustomData,
  type MetaCustomData,
  type MetaUserInput,
} from "@/lib/meta-events";

type Fbq = {
  (
    command: "track" | "trackCustom",
    event: string,
    params?: MetaCustomData,
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

export type TrackMetaInput = {
  eventId?: string;
  customData?: MetaCustomData;
  userData?: MetaUserInput;
};

let pixelId = "";
const sent = new Set<string>();

type QueuedServerEvent = {
  event: string;
  eventId: string;
  eventTime: number;
  eventSourceUrl: string;
  customData?: MetaCustomData;
  userData?: MetaUserInput;
  sent: boolean;
};

const serverQueue: QueuedServerEvent[] = [];
let initiateCheckoutId = "";

function indianMobile(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  let digits = raw.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? digits : undefined;
}

function validEmail(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const email = raw.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320) return undefined;
  return email;
}

function hasCustomerInput(user: MetaUserInput | undefined): boolean {
  if (!user) return false;
  if (validEmail(user.email) || indianMobile(user.phone)) return true;
  if (user.zip && /^[1-9]\d{5}$/.test(user.zip.trim())) return true;
  if (user.firstName?.trim() && user.lastName?.trim()) return true;
  if (user.city?.trim() && user.state?.trim()) return true;
  return false;
}

/** Phone or email, plus city, state, and pincode. Name is included when it was entered. */
function sessionMetaUser(): MetaUserInput | undefined {
  if (typeof window === "undefined") return undefined;
  const draft = getCheckoutDraftSnapshot();
  const phone = indianMobile(draft.contact.phone);
  const email = validEmail(draft.contact.email);
  const city = draft.address.city.trim();
  const state = draft.address.state.trim();
  const zip = draft.address.pincode.trim();
  if (!(phone || email) || !/^[1-9]\d{5}$/.test(zip) || !city || !state) return undefined;

  const [firstName, ...rest] = draft.contact.name.trim().split(/\s+/);
  const lastName = rest.join(" ").trim();
  return {
    ...(email ? { email } : {}),
    ...(phone ? { phone } : {}),
    ...(firstName ? { firstName } : {}),
    ...(lastName ? { lastName } : {}),
    city,
    state,
    zip,
    country: "in",
  };
}

export function configureMetaPixel(id: string): void {
  if (/^\d{8,20}$/.test(id)) pixelId = id;
}

export function metaPixelReady(): boolean {
  return Boolean(pixelId);
}

function whenFbq(send: () => void): void {
  if (!pixelId || typeof window === "undefined") return;
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

function browserId(name: "_fbp" | "_fbc", pattern: RegExp): string | undefined {
  if (typeof document === "undefined") return undefined;
  for (const part of document.cookie.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key !== name) continue;
    const value = decodeURIComponent(rest.join("="));
    return pattern.test(value) ? value : undefined;
  }
  return undefined;
}

function sendPixel(event: string, customData: MetaCustomData | undefined, eventId: string): void {
  whenFbq(() => {
    const command = isStandardMetaEvent(event) ? "track" : "trackCustom";
    window.fbq!(command, event, customData, { eventID: eventId });
  });
}

function sendServer(item: QueuedServerEvent, userData: MetaUserInput): void {
  const fbp = browserId("_fbp", /^fb\.1\.\d{10,13}\.\d{1,20}$/);
  const fbc = browserId("_fbc", /^fb\.1\.\d{10,13}\.[A-Za-z0-9_-]{1,200}$/);
  const body = {
    eventName: item.event,
    eventId: item.eventId,
    eventTime: item.eventTime,
    customData: item.customData,
    userData,
    eventSourceUrl: item.eventSourceUrl,
    ...(fbp ? { fbp } : {}),
    ...(fbc ? { fbc } : {}),
  };

  void fetch(withBasePath("/api/meta/events/"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => {
    // Analytics must never break the page.
  });
}

function flushServerQueue(): void {
  if (typeof window === "undefined") return;
  const sessionUser = sessionMetaUser();
  for (const item of serverQueue) {
    if (item.sent) continue;
    const user = hasCustomerInput(item.userData) ? item.userData : sessionUser;
    if (!user || !hasCustomerInput(user)) continue;
    item.sent = true;
    sendServer(item, user);
  }
}

/**
 * Fire the browser pixel immediately. The server copy waits until user_data has
 * a customer match key, then uses this same event id. Purchase is pixel-only
 * here. The server sends that event from the confirmed order.
 */
export function trackMetaEvent(event: string, input: TrackMetaInput = {}): void {
  if (typeof window === "undefined" || !pixelId) return;
  if (!isStandardMetaEvent(event) && !isCustomMetaEvent(event)) return;
  if (isAdminPath(window.location.pathname)) return;

  const eventId = input.eventId && /^[A-Za-z0-9][A-Za-z0-9_.:-]{7,79}$/.test(input.eventId)
    ? input.eventId
    : crypto.randomUUID();
  const key = `${event}:${eventId}`;
  if (sent.has(key)) return;
  sent.add(key);

  const customData = sanitizeMetaCustomData(input.customData);
  sendPixel(event, customData, eventId);
  if (event === "Purchase") return;

  serverQueue.push({
    event,
    eventId,
    eventTime: Math.floor(Date.now() / 1000),
    eventSourceUrl: window.location.href.split("#")[0]?.slice(0, 500) ?? window.location.href,
    customData,
    userData: input.userData,
    sent: false,
  });
  flushServerQueue();
}

export function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

let lastPath = "";

/** PageView on each storefront navigation, plus ViewContent on the product page. */
export function trackMetaPage(pathname: string): void {
  if (!pixelId) return;
  if (isAdminPath(pathname)) {
    lastPath = "";
    return;
  }
  if (lastPath === pathname) return;
  lastPath = pathname;

  trackMetaEvent("PageView");
  if (pathname === "/") {
    trackMetaEvent("ViewContent", {
      customData: {
        content_name: PRODUCT.shortName,
        content_ids: [PRODUCT.id],
        content_type: "product",
        value: PRODUCT.unitPricePaise / 100,
        currency: PRODUCT.currency,
      },
    });
  }
  flushServerQueue();
}

function checkoutCustomData(lines: readonly CartLine[]): MetaCustomData {
  const selected = lines.filter((line) => line.quantity > 0);
  return {
    content_name: PRODUCT.shortName,
    content_ids: selected.map((line) => line.colorway),
    content_type: "product",
    value: cartTotalPaise(lines) / 100,
    currency: PRODUCT.currency,
    num_items: cartTotalQty(lines),
  };
}

export function trackMetaInitiateCheckout(lines: readonly CartLine[]): void {
  if (!pixelId || typeof window === "undefined") return;
  if (isAdminPath(window.location.pathname)) return;

  const customData = checkoutCustomData(lines);
  if (!initiateCheckoutId) {
    initiateCheckoutId = crypto.randomUUID();
    trackMetaEvent("InitiateCheckout", { eventId: initiateCheckoutId, customData });
    return;
  }

  const queued = serverQueue.find(
    (item) => item.event === "InitiateCheckout" && item.eventId === initiateCheckoutId && !item.sent,
  );
  if (queued) queued.customData = sanitizeMetaCustomData(customData);
  flushServerQueue();
}

/** Browser pixel only. The matching server event is sent when the order is confirmed. */
export function trackMetaPurchase(order: {
  orderId: string;
  amountPaise: number;
  lines: readonly CartLine[];
}): void {
  if (!pixelId || typeof window === "undefined") return;
  if (!isMetaOrderId(order.orderId)) return;

  const key = `ickdeath-meta-purchase:${order.orderId}`;
  try {
    if (sessionStorage.getItem(key) === "1") return;
    sessionStorage.setItem(key, "1");
  } catch {
    // Private mode can block storage. The in-memory set in trackMetaEvent still blocks this render.
  }

  const selected = order.lines.filter((line) => line.quantity > 0);
  trackMetaEvent("Purchase", {
    eventId: order.orderId,
    customData: {
      value: order.amountPaise / 100,
      currency: PRODUCT.currency,
      order_id: order.orderId,
      content_ids: selected.map((line) => line.colorway),
      content_name: selected.map((line) => productNameForColorway(line.colorway)).join(", ").slice(0, 200),
      content_type: "product",
      num_items: selected.reduce((sum, line) => sum + line.quantity, 0),
    },
  });
}

function isMetaOrderId(value: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9_.:-]{7,79}$/.test(value);
}
