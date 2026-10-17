import {
  getHdfcPaymentAdmin,
  getOrderAdmin,
  isFirebaseAdminConfigured,
  markOrderPaidAdmin,
  markOrderPaymentStatusAdmin,
} from "@/lib/firebase-admin";
import {
  classifyHdfcStatus,
  fetchHdfcOrderStatus,
  type HdfcOutcome,
} from "@/lib/hdfc-server";
import { formatOrderItems, PRODUCT } from "@/lib/product";
import { notifyOrderWhatsApp } from "@/lib/whatsapp-notify";
import type { PlacedOrder } from "@/lib/orders";

export type HdfcFulfillResult = {
  outcome: HdfcOutcome | "mismatch";
  orderId: string | null;
};

/**
 * Confirm a SmartGateway order with the Order Status API, then mark our order.
 * Amount and order id must match what we stored before redirecting the customer.
 */
export async function fulfillHdfcPayment(hdfcOrderId: string): Promise<HdfcFulfillResult> {
  if (!isFirebaseAdminConfigured()) {
    throw new Error("Firebase Admin is not configured");
  }

  const payment = await getHdfcPaymentAdmin(hdfcOrderId);
  if (!payment) return { outcome: "failed", orderId: null };

  const order = await getOrderAdmin(payment.orderId);
  if (!order) return { outcome: "failed", orderId: payment.orderId };

  const gateway = await fetchHdfcOrderStatus(hdfcOrderId);
  if (gateway.orderId && gateway.orderId !== hdfcOrderId) {
    console.error("hdfc order id mismatch", { hdfcOrderId, gateway: gateway.orderId });
    return { outcome: "mismatch", orderId: order.orderId };
  }

  const outcome = classifyHdfcStatus(gateway.status);

  if (outcome === "paid") {
    if (gateway.amountPaise !== payment.amountPaise || gateway.amountPaise !== order.amountPaise) {
      console.error("hdfc amount mismatch", {
        orderId: order.orderId,
        expected: payment.amountPaise,
        stored: order.amountPaise,
        charged: gateway.amountPaise,
      });
      return { outcome: "mismatch", orderId: order.orderId };
    }

    if (order.paymentStatus === "paid") {
      if (order.hdfcOrderId && order.hdfcOrderId !== hdfcOrderId) {
        console.error("hdfc duplicate charge", {
          orderId: order.orderId,
          hdfcOrderId,
        });
      }
      return { outcome: "paid", orderId: order.orderId };
    }

    const paid = {
      ...order,
      paymentMethod: "hdfc" as const,
      paymentStatus: "paid" as const,
      hdfcOrderId,
      hdfcTxnId: gateway.txnId || undefined,
    };
    await markOrderPaidAdmin({
      order: paid,
      hdfcOrderId,
      hdfcTxnId: gateway.txnId || undefined,
    });

    try {
      await notifyOrderWhatsApp({ order: paid, event: "confirmed" });
    } catch (err) {
      console.error("whatsapp confirmed failed", err);
    }
    await postOrdersWebhook(paid);

    return { outcome: "paid", orderId: order.orderId };
  }

  const latestAttempt = !order.hdfcOrderId || order.hdfcOrderId === hdfcOrderId;
  if (
    (outcome === "failed" || outcome === "cancelled") &&
    latestAttempt &&
    order.paymentStatus !== "paid"
  ) {
    await markOrderPaymentStatusAdmin({
      orderId: order.orderId,
      paymentStatus: "failed",
    });
  }

  return { outcome, orderId: order.orderId };
}

async function postOrdersWebhook(order: PlacedOrder): Promise<void> {
  const url = process.env.NEXT_PUBLIC_ORDERS_WEBHOOK_URL ?? "";
  if (!url) return;

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...order,
        productId: PRODUCT.id,
        productName: formatOrderItems(order),
        source: "ickdeath-website",
      }),
    });
  } catch {
    // Webhook is best-effort.
  }
}
