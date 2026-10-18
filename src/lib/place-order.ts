import { cartTotalPaise, cartTotalQty, formatOrderItems } from "@/lib/product";
import {
  generateOrderId,
  type CheckoutDraft,
  type PlacedOrder,
} from "@/lib/orders";
import { isFirebaseConfigured } from "@/lib/firebase";
import { createOrderInFirestore } from "@/lib/orders-db";
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
    `Payment: ${order.paymentMethod.toUpperCase()} (${order.paymentStatus})`,
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
  const normalized = path.endsWith("/") ? path.slice(0, -1) : path;
  return withBasePath(normalized);
}

/** Create a pending order, then send the customer to HDFC SmartGateway. */
export async function startHdfcCheckout(input: {
  draft: CheckoutDraft;
}): Promise<void> {
  const pending = buildPendingOrder(input.draft);

  if (!isFirebaseConfigured()) {
    throw new Error("Firebase is not configured");
  }
  await createOrderInFirestore(pending);

  const res = await fetch(apiUrl("/api/hdfc/session"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId: pending.orderId }),
  });
  const data = (await res.json()) as { paymentLink?: string; error?: string };
  if (!res.ok || !data.paymentLink) {
    throw new Error(data.error ?? "Could not start HDFC payment");
  }

  window.location.assign(data.paymentLink);
}
