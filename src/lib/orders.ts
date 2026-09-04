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

export type PlacedOrder = CheckoutDraft & {
  orderId: string;
  createdAt: string;
  amountPaise: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
};

export function generateOrderId(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `ICK-${y}${m}${d}-${rand}`;
}

export function isValidIndianPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return /^[6-9]\d{9}$/.test(digits);
  if (digits.length === 12 && digits.startsWith("91")) {
    return /^91[6-9]\d{9}$/.test(digits);
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
