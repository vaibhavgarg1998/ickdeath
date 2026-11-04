import {
  formatOrderItems,
  type CartLine,
  type ColorwayId,
} from "@/lib/product";

export type { CartLine };

export type CheckoutContact = {
  name: string;
  phone: string;
  email: string;
};

export type CheckoutAddress = {
  line1: string;
  line2: string;
  pincode: string;
  city: string;
  state: string;
};

export type CheckoutDraft = {
  /** Selected editions with per-colorway quantities. */
  lines: CartLine[];
  /** Total packs across all lines (kept in sync for payment + legacy). */
  quantity: number;
  /** Focused / primary colorway for preview + deep links. */
  colorway: ColorwayId;
  contact: CheckoutContact;
  address: CheckoutAddress;
};

export type PaymentMethod = "cod" | "hdfc" | "razorpay" | "whatsapp";

export type PaymentStatus = "pending" | "paid" | "failed";

export type OrderStatus =
  | "confirmed"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled";

export const ORDER_STATUSES: OrderStatus[] = [
  "confirmed",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
];

export const PAYMENT_STATUSES: PaymentStatus[] = ["pending", "paid", "failed"];

export type WhatsAppSendStatus =
  | "accepted"
  | "sent"
  | "delivered"
  | "read"
  | "failed";

export type WhatsAppOrderEvent =
  | "confirmed"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled";

export type OrderWhatsApp = {
  lastEvent?: WhatsAppOrderEvent | string;
  lastTemplate?: string;
  lastMessageId?: string;
  lastSentAt?: string;
  lastStatus?: WhatsAppSendStatus;
  lastError?: string;
  eventsSent?: string[];
};

export type PlacedOrder = CheckoutDraft & {
  orderId: string;
  createdAt: string;
  amountPaise: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  /** SmartGateway order id (alphanumeric, separate from the customer-facing ICK id). */
  hdfcOrderId?: string;
  /** Transaction id from the Order Status API. Receipts use this, not the browser redirect. */
  hdfcTxnId?: string;
  /** Last Order Status API status stored for this order. */
  hdfcStatus?: string;
  /** Amount (paise) returned by the Order Status API. */
  hdfcAmountPaise?: number;
  /** Outcome of the last status check. A receipt is shown only when this is paid. */
  hdfcResult?: "paid" | "pending" | "failed" | "cancelled" | "mismatch" | "duplicate";
  /** Kept for orders placed before the HDFC switch. */
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  whatsapp?: OrderWhatsApp;
};

function randomOrderSuffix(): string {
  const buf = new Uint32Array(1);
  globalThis.crypto.getRandomValues(buf);
  return String(1000 + (buf[0]! % 9000));
}

export function generateOrderId(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `ICK-${y}${m}${d}-${randomOrderSuffix()}`;
}

export function isNormalizedMobile(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(phone);
}

export function isValidIndianPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return isNormalizedMobile(digits);
  if (digits.length === 11 && digits.startsWith("0")) {
    return isNormalizedMobile(digits.slice(1));
  }
  if (digits.length === 12 && digits.startsWith("91")) {
    return isNormalizedMobile(digits.slice(2));
  }
  return false;
}

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits;
}

export function isValidPincode(pincode: string): boolean {
  return /^[1-9][0-9]{5}$/.test(pincode.trim());
}

export function isValidEmail(email: string): boolean {
  if (!email.trim()) return true; // optional
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export const ORDER_ID_PATTERN = /^ICK-\d{8}-\d{4}$/;

export function normalizeOrderId(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

/**
 * Inserts dashes while an order ID is typed: ICK-YYYYMMDD-1234.
 * Mobile numbers (no letters) are left unchanged.
 * A trailing dash is not put back if the user just deleted it.
 */
export function formatTrackQueryInput(raw: string, previous = ""): string {
  const compact = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!/[A-Z]/.test(compact)) return raw;

  const prevCompact = previous.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const deletedSeparator =
    raw.length < previous.length && compact === prevCompact;

  const formatted = maskOrderIdInput(compact);
  if (
    deletedSeparator &&
    formatted.endsWith("-") &&
    formatted.slice(0, -1).replace(/[^A-Z0-9]/g, "") === compact
  ) {
    return formatted.slice(0, -1);
  }
  return formatted;
}

function maskOrderIdInput(compact: string): string {
  const prefix = "ICK";
  if (prefix.startsWith(compact)) {
    return compact.length === prefix.length ? `${prefix}-` : compact;
  }
  if (!compact.startsWith(prefix)) return compact;

  const digits = compact.slice(prefix.length).replace(/\D/g, "").slice(0, 12);
  const date = digits.slice(0, 8);
  const seq = digits.slice(8, 12);
  if (digits.length === 0) return `${prefix}-`;
  if (digits.length < 8) return `${prefix}-${date}`;
  if (digits.length === 8) return `${prefix}-${date}-`;
  return `${prefix}-${date}-${seq}`;
}

export function isValidOrderId(orderId: string): boolean {
  return ORDER_ID_PATTERN.test(normalizeOrderId(orderId));
}

export type TrackQueryKind =
  | { kind: "orderId"; orderId: string }
  | { kind: "phone"; phone: string };

export function parseTrackQuery(
  raw: string,
): TrackQueryKind | { kind: "invalid"; message: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return {
      kind: "invalid",
      message: "Enter an order ID or 10-digit mobile number",
    };
  }

  const compact = trimmed.replace(/\s+/g, "");
  if (/ick/i.test(compact)) {
    const orderId = normalizeOrderId(compact);
    if (!isValidOrderId(orderId)) {
      return {
        kind: "invalid",
        message: "Order ID looks like ICK-20260904-1234",
      };
    }
    return { kind: "orderId", orderId };
  }

  if (isValidIndianPhone(trimmed) || isValidIndianPhone(compact)) {
    const phone = normalizePhone(trimmed);
    if (isNormalizedMobile(phone)) {
      return { kind: "phone", phone };
    }
  }

  return {
    kind: "invalid",
    message: "Enter a valid order ID or 10-digit mobile number",
  };
}

/** Forms `contact.phone` may have been stored as in Firestore. */
export function uniquePhoneVariants(phone: string): string[] {
  const n = normalizePhone(phone);
  if (!isNormalizedMobile(n)) return n ? [n] : [];
  return [
    ...new Set([
      n,
      `91${n}`,
      `+91${n}`,
      `+91 ${n}`,
      `0${n}`,
      `91 ${n}`,
      `${n.slice(0, 5)} ${n.slice(5)}`,
      `${n.slice(0, 5)}-${n.slice(5)}`,
    ]),
  ];
}

export const TRACK_SENTINEL_ID = "__track_sentinel__";

/** Public fields shown on the track-order page (no email, street, or payment IDs). */
export type PublicTrackedOrder = {
  orderId: string;
  createdAt: string;
  productName: string;
  quantity: number;
  amountPaise: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  customerName: string;
  city: string;
  state: string;
  pincode: string;
};

export const FULFILLMENT_STEPS: Exclude<OrderStatus, "cancelled">[] = [
  "confirmed",
  "packed",
  "shipped",
  "delivered",
];

export function fulfillmentStepIndex(status: OrderStatus): number {
  if (status === "cancelled") return -1;
  return FULFILLMENT_STEPS.indexOf(status);
}

function asPaymentMethod(value: unknown): PaymentMethod {
  if (
    value === "cod" ||
    value === "hdfc" ||
    value === "razorpay" ||
    value === "whatsapp"
  ) {
    return value;
  }
  return "hdfc";
}

export function paymentMethodLabel(method: PaymentMethod): string {
  if (method === "cod") return "Cash on delivery";
  if (method === "hdfc") return "HDFC";
  if (method === "razorpay") return "Razorpay";
  return "WhatsApp";
}

export function paymentStatusLabel(
  method: PaymentMethod,
  status: PaymentStatus,
): string {
  if (method === "cod" && status === "pending") return "Pay on delivery";
  if (status === "paid") return "Paid";
  if (status === "failed") return "Failed";
  return "Pending";
}

function asPaymentStatus(value: unknown): PaymentStatus {
  if (value === "paid" || value === "failed") return value;
  return "pending";
}

function asOrderStatus(value: unknown): OrderStatus {
  if (
    value === "packed" ||
    value === "shipped" ||
    value === "delivered" ||
    value === "cancelled"
  ) {
    return value;
  }
  return "confirmed";
}

export function toPublicTrackedOrder(data: {
  orderId?: unknown;
  createdAt?: unknown;
  productName?: unknown;
  quantity?: unknown;
  colorway?: unknown;
  lines?: CartLine[] | null;
  amountPaise?: unknown;
  paymentMethod?: unknown;
  paymentStatus?: unknown;
  orderStatus?: unknown;
  contact?: { name?: unknown } | null;
  address?: {
    city?: unknown;
    state?: unknown;
    pincode?: unknown;
  } | null;
}): PublicTrackedOrder {
  const quantity = Number(data.quantity ?? 1);
  const productName = formatOrderItems({
    lines: data.lines,
    colorway: data.colorway,
    quantity,
    productName: String(data.productName ?? ""),
  });

  return {
    orderId: String(data.orderId ?? ""),
    createdAt: String(data.createdAt ?? ""),
    productName,
    quantity,
    amountPaise: Number(data.amountPaise ?? 0),
    paymentMethod: asPaymentMethod(data.paymentMethod),
    paymentStatus: asPaymentStatus(data.paymentStatus),
    orderStatus: asOrderStatus(data.orderStatus),
    customerName: String(data.contact?.name ?? ""),
    city: String(data.address?.city ?? ""),
    state: String(data.address?.state ?? ""),
    pincode: String(data.address?.pincode ?? ""),
  };
}
