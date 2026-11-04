import { cartTotalPaise, cartTotalQty, formatOrderItems } from "@/lib/product";
import {
  generateOrderId,
  paymentMethodLabel,
  paymentStatusLabel,
  type CheckoutDraft,
  type PlacedOrder,
} from "@/lib/orders";
import { isFirebaseConfigured } from "@/lib/firebase";
import { createOrderInFirestore, getOrderFromFirestore } from "@/lib/orders-db";
import { HDFC_CHECKOUT_ENABLED } from "@/lib/payments";
import { withBasePath } from "@/lib/paths";

function whatsappBusinessNumber(): string {
  return (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "").replace(/\D/g, "");
}

export function buildCustomerWhatsAppMessage(order: PlacedOrder): string {
  const rupees = (order.amountPaise / 100).toFixed(0);
  return [
    `Hi! I just placed order *${order.orderId}* on ickdeath.com.`,
    ``,
    `*${formatOrderItems(order)}*`,
    `Amount: ₹${rupees}`,
    `Name: ${order.contact.name}`,
    `Phone: ${order.contact.phone}`,
    `Address: ${order.address.line1}${order.address.line2 ? `, ${order.address.line2}` : ""}, ${order.address.city}, ${order.address.state} ${order.address.pincode}`,
    `Payment: ${paymentMethodLabel(order.paymentMethod)} (${paymentStatusLabel(order.paymentMethod, order.paymentStatus)})`,
  ].join("\n");
}

export function customerWhatsAppUrl(order: PlacedOrder): string | null {
  const n = whatsappBusinessNumber();
  if (!n) return null;
  const text = encodeURIComponent(buildCustomerWhatsAppMessage(order));
  return `https://wa.me/${n}?text=${text}`;
}

function buildPendingOrder(draft: CheckoutDraft): PlacedOrder {
  const quantity = cartTotalQty(draft.lines);
  return {
    ...draft,
    quantity,
    colorway: draft.lines[0]?.colorway ?? draft.colorway,
    orderId: generateOrderId(),
    createdAt: new Date().toISOString(),
    amountPaise: cartTotalPaise(draft.lines),
    paymentMethod: "hdfc",
    paymentStatus: "pending",
    orderStatus: "confirmed",
  };
}

function apiUrl(path: string): string {
  const withSlash = path.endsWith("/") ? path : `${path}/`;
  return withBasePath(withSlash);
}

/** Save a cash-on-delivery order on the server, then open the confirmation. */
export async function startCodCheckout(input: {
  draft: CheckoutDraft;
}): Promise<void> {
  const res = await fetch(apiUrl("/api/orders/cod/"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ draft: input.draft }),
  });
  const raw = await res.text();
  let data: { orderId?: string; error?: string } = {};
  if (raw) {
    try {
      data = JSON.parse(raw) as typeof data;
    } catch {
      throw new Error("Could not place order");
    }
  }
  if (!res.ok || !data.orderId) {
    throw new Error(data.error ?? "Could not place order");
  }

  window.location.assign(
    withBasePath(`/checkout/success/?order=${encodeURIComponent(data.orderId)}`),
  );
}

/** Create a pending order, then send the customer to HDFC SmartGateway. */
export async function startHdfcCheckout(input: {
  draft: CheckoutDraft;
}): Promise<void> {
  if (!HDFC_CHECKOUT_ENABLED) {
    throw new Error("Online payment is paused. Use cash on delivery.");
  }
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase is not configured");
  }

  let pending: PlacedOrder | null = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = buildPendingOrder(input.draft);
    const existing = await getOrderFromFirestore(candidate.orderId);
    if (existing) continue;
    try {
      await createOrderInFirestore(candidate);
      pending = candidate;
      break;
    } catch (err) {
      if (attempt === 4) throw err;
    }
  }
  if (!pending) {
    throw new Error("Could not allocate an order id");
  }

  const res = await fetch(apiUrl("/api/hdfc/session/"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId: pending.orderId }),
  });
  const raw = await res.text();
  let data: { paymentLink?: string; error?: string } = {};
  if (raw) {
    try {
      data = JSON.parse(raw) as typeof data;
    } catch {
      throw new Error("Could not start HDFC payment");
    }
  }
  if (!res.ok || !data.paymentLink) {
    throw new Error(data.error ?? "Could not start HDFC payment");
  }

  window.location.assign(data.paymentLink);
}
