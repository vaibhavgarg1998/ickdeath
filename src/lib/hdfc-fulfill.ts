import {
  finalizeHdfcPaidAdmin,
  getHdfcPaymentAdmin,
  getOrderAdmin,
  isFirebaseAdminConfigured,
  recordHdfcAttemptAdmin,
} from "@/lib/firebase-admin";
import {
  classifyHdfcStatus,
  fetchHdfcOrderStatus,
  type HdfcGatewayStatus,
  type HdfcOutcome,
} from "@/lib/hdfc-server";
import { postOrdersWebhook } from "@/lib/orders-webhook";
import { notifyOrderWhatsApp } from "@/lib/whatsapp-notify";
import type { PlacedOrder } from "@/lib/orders";

export type HdfcFulfillResult = {
  outcome: HdfcOutcome | "mismatch" | "duplicate";
  orderId: string | null;
};

function sameId(a: string, b: string): boolean {
  return a.trim().toUpperCase() === b.trim().toUpperCase();
}

/**
 * Confirm a SmartGateway order with the Order Status API, then store that
 * response. The browser return payload is not trusted. A receipt is written
 * only when the status is CHARGED and the order id, merchant order id, and
 * amount all match the row created before the customer left for HDFC.
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
  const orderIdMatched = !gateway.orderId || sameId(gateway.orderId, hdfcOrderId);
  const merchantMatched =
    !gateway.merchantOrderId || gateway.merchantOrderId === payment.orderId;
  const amountPresent = gateway.amountPaise != null;
  const amountMatched =
    amountPresent &&
    gateway.amountPaise === payment.amountPaise &&
    gateway.amountPaise === order.amountPaise;

  if (!orderIdMatched || !merchantMatched || (amountPresent && !amountMatched)) {
    console.error("hdfc response mismatch", {
      orderId: order.orderId,
      hdfcOrderId,
      gatewayOrderId: gateway.orderId,
      merchantOrderId: gateway.merchantOrderId,
      expected: payment.amountPaise,
      stored: order.amountPaise,
      charged: gateway.amountPaise,
    });
    await recordHdfcAttemptAdmin({
      orderId: order.orderId,
      hdfcOrderId,
      txnId: gateway.txnId,
      gatewayStatus: gateway.status,
      gatewayAmountPaise: gateway.amountPaise,
      result: "mismatch",
      orderIdMatched,
      amountMatched,
    });
    return { outcome: "mismatch", orderId: order.orderId };
  }

  const outcome = classifyHdfcStatus(gateway.status);

  if (outcome === "paid") {
    if (!amountMatched || gateway.amountPaise == null) {
      await recordHdfcAttemptAdmin({
        orderId: order.orderId,
        hdfcOrderId,
        txnId: gateway.txnId,
        gatewayStatus: gateway.status,
        gatewayAmountPaise: gateway.amountPaise,
        result: "mismatch",
        orderIdMatched,
        amountMatched: false,
      });
      return { outcome: "mismatch", orderId: order.orderId };
    }

    const commit = await finalizeHdfcPaidAdmin({
      order,
      hdfcOrderId,
      txnId: gateway.txnId,
      gatewayStatus: gateway.status,
      gatewayAmountPaise: gateway.amountPaise,
    });

    if (commit === "duplicate") {
      console.error("hdfc duplicate charge", { orderId: order.orderId, hdfcOrderId });
      return { outcome: "duplicate", orderId: order.orderId };
    }

    if (commit === "created") {
      const paid = paidOrder(order, hdfcOrderId, gateway);
      try {
        await notifyOrderWhatsApp({ order: paid, event: "confirmed" });
      } catch (err) {
        console.error("whatsapp confirmed failed", err);
      }
      await postOrdersWebhook(paid);
    }

    return { outcome: "paid", orderId: order.orderId };
  }

  await recordHdfcAttemptAdmin({
    orderId: order.orderId,
    hdfcOrderId,
    txnId: gateway.txnId,
    gatewayStatus: gateway.status,
    gatewayAmountPaise: gateway.amountPaise,
    result: outcome,
    orderIdMatched,
    amountMatched,
  });

  return { outcome, orderId: order.orderId };
}

function paidOrder(
  order: PlacedOrder,
  hdfcOrderId: string,
  gateway: HdfcGatewayStatus,
): PlacedOrder {
  return {
    ...order,
    paymentMethod: "hdfc",
    paymentStatus: "paid",
    hdfcOrderId,
    hdfcStatus: gateway.status,
    hdfcAmountPaise: gateway.amountPaise ?? order.amountPaise,
    hdfcResult: "paid",
    ...(gateway.txnId ? { hdfcTxnId: gateway.txnId } : {}),
  };
}

