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
  quantity: number;
  contact: CheckoutContact;
  address: CheckoutAddress;
};

export type PaymentMethod = "razorpay" | "whatsapp";

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
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  whatsapp?: OrderWhatsApp;
};

export function generateOrderId(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `ICK-${y}${m}${d}-${rand}`;
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
  return value === "whatsapp" ? "whatsapp" : "razorpay";
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
  return {
    orderId: String(data.orderId ?? ""),
    createdAt: String(data.createdAt ?? ""),
    productName: String(data.productName ?? ""),
    quantity: Number(data.quantity ?? 1),
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
