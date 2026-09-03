import { lineTotalPaise, PRODUCT } from "@/lib/product";
import {
  generateOrderId,
  type CheckoutDraft,
  type PaymentMethod,
  type PlacedOrder,
} from "@/lib/orders";

function whatsappBusinessNumber(): string {
  return (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "").replace(/\D/g, "");
}

function ordersWebhookUrl(): string {
  return process.env.NEXT_PUBLIC_ORDERS_WEBHOOK_URL ?? "";
}

export function buildCustomerWhatsAppMessage(order: PlacedOrder): string {
  const rupees = (order.amountPaise / 100).toFixed(0);
  return [
    `Hi! I just placed order *${order.orderId}* on ickdeath.com.`,
    ``,
    `*${PRODUCT.name}* × ${order.quantity}`,
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

async function postWebhook(order: PlacedOrder): Promise<void> {
  const url = ordersWebhookUrl();
  if (!url) return;

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...order,
        productId: PRODUCT.id,
        productName: PRODUCT.name,
        source: "ickdeath-website",
      }),
      mode: "no-cors",
    });
  } catch {
    // Webhook is best-effort in Phase 1 (Google Apps Script / Sheet).
  }
}

export async function placeOrder(input: {
  draft: CheckoutDraft;
  paymentMethod: PaymentMethod;
}): Promise<PlacedOrder> {
  const order: PlacedOrder = {
    ...input.draft,
    orderId: generateOrderId(),
    createdAt: new Date().toISOString(),
    amountPaise: lineTotalPaise(input.draft.quantity),
    paymentMethod: input.paymentMethod,
    // Phase 1: payment confirmed manually / via WhatsApp until Razorpay webhooks.
    paymentStatus: input.paymentMethod === "whatsapp" ? "pending" : "pending",
    orderStatus: "confirmed",
  };

  await postWebhook(order);
  return order;
}
