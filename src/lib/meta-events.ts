export const STANDARD_META_EVENTS = [
  "PageView",
  "ViewContent",
  "Search",
  "Lead",
  "CompleteRegistration",
  "AddToCart",
  "InitiateCheckout",
  "Purchase",
  "Contact",
] as const;

export type StandardMetaEvent = (typeof STANDARD_META_EVENTS)[number];

export type MetaContent = {
  id: string;
  quantity: number;
  item_price?: number;
};

export type MetaCustomData = {
  value?: number;
  currency?: string;
  content_ids?: string[];
  content_name?: string;
  content_type?: string;
  content_category?: string;
  contents?: MetaContent[];
  num_items?: number;
  search_string?: string;
  order_id?: string;
};

export type MetaUserInput = {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  externalId?: string;
};

const STANDARD_SET = new Set<string>(STANDARD_META_EVENTS);

export function isStandardMetaEvent(value: string): value is StandardMetaEvent {
  return STANDARD_SET.has(value);
}

/** Custom names cannot shadow a standard event. */
export function isCustomMetaEvent(value: string): boolean {
  return !isStandardMetaEvent(value) && /^[A-Za-z][A-Za-z0-9_]{1,39}$/.test(value);
}

export function isMetaEventId(value: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9_.:-]{7,79}$/.test(value);
}

function cleanText(value: unknown, max: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const text = value.trim().replace(/[\u0000-\u001F\u007F]/g, "");
  if (!text || text.length > max) return undefined;
  return text;
}

function cleanNumber(value: unknown, max: number): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > max) {
    return undefined;
  }
  return Math.round(value * 100) / 100;
}

export function sanitizeMetaCustomData(input: unknown): MetaCustomData | undefined {
  if (!input || typeof input !== "object") return undefined;
  const raw = input as Record<string, unknown>;
  const data: MetaCustomData = {};

  const value = cleanNumber(raw.value, 1_000_000);
  if (value != null) data.value = value;

  if (typeof raw.currency === "string" && /^[A-Z]{3}$/.test(raw.currency)) {
    data.currency = raw.currency;
  }

  if (Array.isArray(raw.content_ids)) {
    const ids = raw.content_ids
      .filter((id): id is string => typeof id === "string")
      .map((id) => id.trim())
      .filter((id) => /^[A-Za-z0-9_-]{1,64}$/.test(id))
      .slice(0, 20);
    if (ids.length) data.content_ids = ids;
  }

  const contentName = cleanText(raw.content_name, 200);
  if (contentName) data.content_name = contentName;
  const contentType = cleanText(raw.content_type, 50);
  if (contentType) data.content_type = contentType;
  const contentCategory = cleanText(raw.content_category, 100);
  if (contentCategory) data.content_category = contentCategory;
  const search = cleanText(raw.search_string, 200);
  if (search) data.search_string = search;
  const orderId = cleanText(raw.order_id, 64);
  if (orderId) data.order_id = orderId;

  const numItems = cleanNumber(raw.num_items, 999);
  if (numItems != null && Number.isInteger(numItems)) data.num_items = numItems;

  if (Array.isArray(raw.contents)) {
    const contents: MetaContent[] = [];
    for (const entry of raw.contents.slice(0, 20)) {
      if (!entry || typeof entry !== "object") continue;
      const item = entry as Record<string, unknown>;
      const id = typeof item.id === "string" ? item.id.trim() : "";
      const quantity = item.quantity;
      if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) continue;
      if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
        continue;
      }
      const price = cleanNumber(item.item_price, 1_000_000);
      contents.push(price != null ? { id, quantity, item_price: price } : { id, quantity });
    }
    if (contents.length) data.contents = contents;
  }

  return Object.keys(data).length ? data : undefined;
}

export function sanitizeMetaUserInput(input: unknown): MetaUserInput | undefined {
  if (!input || typeof input !== "object") return undefined;
  const raw = input as Record<string, unknown>;
  const user: MetaUserInput = {};
  const email = cleanText(raw.email, 320);
  if (email) user.email = email;
  const phone = cleanText(raw.phone, 24);
  if (phone) user.phone = phone;
  const firstName = cleanText(raw.firstName, 80);
  if (firstName) user.firstName = firstName;
  const lastName = cleanText(raw.lastName, 80);
  if (lastName) user.lastName = lastName;
  const externalId = cleanText(raw.externalId, 64);
  if (externalId) user.externalId = externalId;
  return Object.keys(user).length ? user : undefined;
}
