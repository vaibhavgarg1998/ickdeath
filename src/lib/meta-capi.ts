import { createHash } from "crypto";
import { formatOrderItems } from "@/lib/product";
import type { PlacedOrder } from "@/lib/orders";
import {
  isCustomMetaEvent,
  isMetaEventId,
  isStandardMetaEvent,
  sanitizeMetaCustomData,
  sanitizeMetaUserInput,
  type MetaCustomData,
  type MetaUserInput,
} from "@/lib/meta-events";

const DEFAULT_GRAPH_VERSION = "v26.0";
const PIXEL_ID_FALLBACK = "2318506675660316";

export type MetaBrowserContext = {
  clientIpAddress?: string;
  clientUserAgent?: string;
  fbp?: string;
  fbc?: string;
  eventSourceUrl?: string;
};

export type MetaSendResult = {
  ok: boolean;
  reason?: "not_configured" | "invalid_event" | "no_user_data" | "meta_rejected" | "timeout" | "unavailable";
  eventsReceived?: number;
};

type ServerEvent = {
  event_name: string;
  event_time: number;
  event_id: string;
  action_source: "website";
  event_source_url?: string;
  user_data: Record<string, string | string[]>;
  custom_data?: MetaCustomData;
};

/** Pixel id is public. The access token is read only inside this server module. */
export function metaPixelId(): string {
  const raw = (
    process.env.META_PIXEL_ID ||
    process.env.NEXT_PUBLIC_META_PIXEL_ID ||
    PIXEL_ID_FALLBACK
  ).trim();
  return /^\d{8,20}$/.test(raw) ? raw : "";
}

function graphVersion(): string {
  const raw = process.env.META_GRAPH_VERSION?.trim() || DEFAULT_GRAPH_VERSION;
  return /^v\d+\.\d+$/.test(raw) ? raw : DEFAULT_GRAPH_VERSION;
}

/** Sent only when META_TEST_EVENT_CODE is set. Remove it when testing is done. */
export function metaTestEventCode(): string | undefined {
  const code = process.env.META_TEST_EVENT_CODE?.trim() ?? "";
  if (!code || !/^TEST[A-Z0-9]{1,24}$/i.test(code)) return undefined;
  return code;
}

export function metaCapiConfigured(): boolean {
  const token = process.env.META_ACCESS_TOKEN?.trim() ?? "";
  return Boolean(token && metaPixelId());
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function hashEmail(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const email = raw.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320) return undefined;
  return sha256(email);
}

function hashPhone(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  let digits = raw.replace(/\D/g, "").replace(/^0+/, "");
  if (digits.length === 10) digits = `91${digits}`;
  if (digits.length < 11 || digits.length > 15) return undefined;
  return sha256(digits);
}

function hashName(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const name = raw.trim().toLowerCase().replace(/[^\p{L}]/gu, "");
  if (!name || name.length > 80) return undefined;
  return sha256(name);
}

function hashZip(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const zip = raw.trim().toLowerCase().replace(/[\s-]/g, "");
  if (!/^[a-z0-9]{3,10}$/.test(zip)) return undefined;
  return sha256(zip);
}

function hashCountry(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const country = raw.trim().toLowerCase();
  if (!/^[a-z]{2}$/.test(country)) return undefined;
  return sha256(country);
}

function hashExternalId(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const id = raw.trim().toLowerCase();
  if (!id || id.length > 64) return undefined;
  return sha256(id);
}

function hashedUserData(user: MetaUserInput | undefined): Record<string, string[]> {
  const data: Record<string, string[]> = {};
  const email = hashEmail(user?.email);
  const phone = hashPhone(user?.phone);
  const firstName = hashName(user?.firstName);
  const lastName = hashName(user?.lastName);
  const city = hashName(user?.city);
  const state = hashName(user?.state);
  const zip = hashZip(user?.zip);
  const country = hashCountry(user?.country);
  const externalId = hashExternalId(user?.externalId);
  if (email) data.em = [email];
  if (phone) data.ph = [phone];
  if (firstName) data.fn = [firstName];
  if (lastName) data.ln = [lastName];
  if (city) data.ct = [city];
  if (state) data.st = [state];
  if (zip) data.zp = [zip];
  if (country) data.country = [country];
  if (externalId) data.external_id = [externalId];
  return data;
}

/** Keys Events Manager counts. IP, user agent, fbp, and fbc do not qualify. */
const CUSTOMER_MATCH_KEYS = ["em", "ph", "fn", "ln", "ge", "db", "ct", "st", "zp"] as const;

function hasCustomerMatch(data: Record<string, string | string[]>): boolean {
  return CUSTOMER_MATCH_KEYS.some((key) => {
    const value = data[key];
    return Array.isArray(value) ? value.length > 0 : Boolean(value);
  });
}

function resolveEventTime(claimed: unknown): number {
  const now = Math.floor(Date.now() / 1000);
  if (typeof claimed !== "number" || !Number.isInteger(claimed)) return now;
  if (claimed > now + 60 || claimed < now - 7 * 24 * 60 * 60) return now;
  return claimed;
}

function isIp(value: string): boolean {
  if (value.length > 64) return false;
  if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(value)) {
    return value.split(".").every((part) => {
      const n = Number(part);
      return n >= 0 && n <= 255 && String(n) === part;
    });
  }
  return value.includes(":") && /^[0-9a-f:]+$/i.test(value);
}

function cleanBrowserId(value: string | undefined, pattern: RegExp): string | undefined {
  if (!value) return undefined;
  const text = value.trim();
  return pattern.test(text) ? text : undefined;
}

const FBP = /^fb\.1\.\d{10,13}\.\d{1,20}$/;
const FBC = /^fb\.1\.\d{10,13}\.[A-Za-z0-9_-]{1,200}$/;

function cookieValue(header: string | null, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key !== name) continue;
    try {
      return decodeURIComponent(rest.join("="));
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function requestHost(request: Request): string {
  return (request.headers.get("x-forwarded-host") || request.headers.get("host") || "")
    .split(",")[0]
    .trim();
}

export function eventSourceUrl(request: Request, claimed?: unknown): string | undefined {
  const candidate =
    typeof claimed === "string" && claimed.trim()
      ? claimed.trim()
      : request.headers.get("referer");
  if (!candidate) return undefined;
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return undefined;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;
  const host = requestHost(request);
  if (!host || url.host !== host) return undefined;
  if (url.pathname === "/admin" || url.pathname.startsWith("/admin/")) return undefined;
  url.hash = "";
  const href = url.toString();
  return href.length <= 500 ? href : undefined;
}

/**
 * IP comes from Vercel's proxy headers only. A caller-supplied address is ignored.
 * User agent is the header on this request, not a field in the JSON body.
 */
export function browserContextFromRequest(
  request: Request,
  claimed?: { fbp?: unknown; fbc?: unknown; eventSourceUrl?: unknown },
): MetaBrowserContext {
  const context: MetaBrowserContext = {};

  if (process.env.VERCEL) {
    const real = request.headers.get("x-real-ip")?.trim();
    const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const ip = real && isIp(real) ? real : forwarded && isIp(forwarded) ? forwarded : undefined;
    if (ip) context.clientIpAddress = ip;
  }

  const agent = request.headers.get("user-agent")?.trim().replace(/[\u0000-\u001F\u007F]/g, "");
  if (agent && agent.length <= 512) context.clientUserAgent = agent;

  const fbp =
    cleanBrowserId(cookieValue(request.headers.get("cookie"), "_fbp"), FBP) ||
    cleanBrowserId(typeof claimed?.fbp === "string" ? claimed.fbp : undefined, FBP);
  const fbc =
    cleanBrowserId(cookieValue(request.headers.get("cookie"), "_fbc"), FBC) ||
    cleanBrowserId(typeof claimed?.fbc === "string" ? claimed.fbc : undefined, FBC);
  if (fbp) context.fbp = fbp;
  if (fbc) context.fbc = fbc;

  const source = eventSourceUrl(request, claimed?.eventSourceUrl);
  if (source) context.eventSourceUrl = source;
  return context;
}

function userDataPayload(
  user: MetaUserInput | undefined,
  context: MetaBrowserContext | undefined,
): Record<string, string | string[]> {
  const data: Record<string, string | string[]> = hashedUserData(user);
  if (context?.clientIpAddress) data.client_ip_address = context.clientIpAddress;
  if (context?.clientUserAgent) data.client_user_agent = context.clientUserAgent;
  if (context?.fbp) data.fbp = context.fbp;
  if (context?.fbc) data.fbc = context.fbc;
  return data;
}

export async function sendMetaEvent(input: {
  eventName: string;
  eventId: string;
  eventTime?: unknown;
  customData?: MetaCustomData;
  user?: MetaUserInput;
  context?: MetaBrowserContext;
}): Promise<MetaSendResult> {
  if (!isStandardMetaEvent(input.eventName) && !isCustomMetaEvent(input.eventName)) {
    return { ok: false, reason: "invalid_event" };
  }
  if (!isMetaEventId(input.eventId)) return { ok: false, reason: "invalid_event" };

  const pixelId = metaPixelId();
  const token = process.env.META_ACCESS_TOKEN?.trim() ?? "";
  if (!pixelId || !token) return { ok: false, reason: "not_configured" };

  const userData = userDataPayload(input.user, input.context);
  if (!hasCustomerMatch(userData)) return { ok: false, reason: "no_user_data" };

  const event: ServerEvent = {
    event_name: input.eventName,
    event_time: resolveEventTime(input.eventTime),
    event_id: input.eventId,
    action_source: "website",
    user_data: userData,
  };
  if (input.context?.eventSourceUrl) event.event_source_url = input.context.eventSourceUrl;
  const customData = sanitizeMetaCustomData(input.customData);
  if (customData) event.custom_data = customData;

  const testEventCode = metaTestEventCode();
  const body: { data: ServerEvent[]; access_token: string; test_event_code?: string } = {
    data: [event],
    access_token: token,
  };
  if (testEventCode) body.test_event_code = testEventCode;

  const url = `https://graph.facebook.com/${graphVersion()}/${pixelId}/events`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });
    const payload = (await response.json().catch(() => null)) as {
      events_received?: number;
      error?: { code?: number; type?: string };
    } | null;

    if (!response.ok || !payload || payload.events_received !== 1) {
      console.error("meta capi rejected", {
        eventName: input.eventName,
        status: response.status,
        code: payload?.error?.code,
        type: payload?.error?.type,
      });
      return { ok: false, reason: "meta_rejected" };
    }

    if (process.env.NODE_ENV !== "production") {
      console.info("meta capi accepted", {
        eventName: input.eventName,
        eventId: input.eventId,
        eventsReceived: payload.events_received,
        test: Boolean(testEventCode),
      });
    }
    return { ok: true, eventsReceived: payload.events_received };
  } catch (err) {
    const timedOut = err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError");
    console.error("meta capi failed", { eventName: input.eventName, timedOut });
    return { ok: false, reason: timedOut ? "timeout" : "unavailable" };
  }
}

/** Purchase uses the stored order and a server-verified amount. Failures do not throw. */
export async function sendVerifiedPurchase(input: {
  order: PlacedOrder;
  amountPaise: number;
  context?: MetaBrowserContext;
}): Promise<MetaSendResult> {
  if (!Number.isInteger(input.amountPaise) || input.amountPaise <= 0) {
    return { ok: false, reason: "invalid_event" };
  }

  const lines = input.order.lines.filter((line) => line.quantity > 0);
  const [firstName, ...rest] = input.order.contact.name.trim().split(/\s+/);
  const customData: MetaCustomData = {
    value: input.amountPaise / 100,
    currency: "INR",
    order_id: input.order.orderId,
    content_type: "product",
    content_name: formatOrderItems(input.order).slice(0, 200),
    num_items: lines.reduce((sum, line) => sum + line.quantity, 0),
  };
  const contentIds = lines.map((line) => line.colorway);
  if (contentIds.length) customData.content_ids = contentIds;
  if (lines.length) {
    customData.contents = lines.map((line) => ({ id: line.colorway, quantity: line.quantity }));
  }

  return sendMetaEvent({
    eventName: "Purchase",
    eventId: input.order.orderId,
    customData,
    user: sanitizeMetaUserInput({
      email: input.order.contact.email,
      phone: input.order.contact.phone,
      firstName,
      lastName: rest.join(" "),
      city: input.order.address.city,
      state: input.order.address.state,
      zip: input.order.address.pincode,
      country: "in",
      externalId: input.order.orderId,
    }),
    context: input.context,
  });
}
