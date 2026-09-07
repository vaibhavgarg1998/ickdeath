import { lineTotalPaise, PRODUCT } from "@/lib/product";
import {
  generateOrderId,
  type CheckoutDraft,
  type PlacedOrder,
} from "@/lib/orders";
import { isFirebaseConfigured } from "@/lib/firebase";
import { createOrderInFirestore } from "@/lib/orders-db";
import {
  createRazorpayOrder,
  loadRazorpayScript,
  markRazorpayPaymentFailed,
  openRazorpayCheckout,
  verifyRazorpayPayment,
} from "@/lib/razorpay-client";

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
    // Webhook is best-effort.
  }
}

function buildPendingOrder(draft: CheckoutDraft): PlacedOrder {
  return {
    ...draft,
    orderId: generateOrderId(),
    createdAt: new Date().toISOString(),
    amountPaise: lineTotalPaise(draft.quantity),
    paymentMethod: "razorpay",
    paymentStatus: "pending",
    orderStatus: "confirmed",
  };
}

/** Razorpay path — create pending order, collect payment, verify, mark paid. */
export async function placeOrderWithRazorpay(input: {
  draft: CheckoutDraft;
}): Promise<PlacedOrder> {
  const pending = buildPendingOrder(input.draft);

  if (isFirebaseConfigured()) {
    await createOrderInFirestore(pending);
  }

  const scriptOk = await loadRazorpayScript();
  if (!scriptOk) {
    throw new Error("Could not load Razorpay checkout");
  }

  const created = await createRazorpayOrder({
    orderId: pending.orderId,
    draft: input.draft,
  });

  const paid = await new Promise<PlacedOrder>((resolve, reject) => {
    openRazorpayCheckout({
      create: created,
      onDismiss: () => reject(new Error("Payment cancelled")),
      onFailure: (message) => {
        void markRazorpayPaymentFailed(pending.orderId).finally(() => {
          reject(new Error(message));
        });
      },
      onSuccess: (response) => {
        void (async () => {
          try {
            const order = await verifyRazorpayPayment({
              orderId: pending.orderId,
              draft: input.draft,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            resolve(order);
          } catch (err) {
            reject(err);
          }
        })();
      },
    });
  });

  await postWebhook(paid);
  return paid;
}
