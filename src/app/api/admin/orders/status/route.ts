import { NextResponse } from "next/server";
import {
  getOrderAdmin,
  isFirebaseAdminConfigured,
  updateOrderStatusesAdmin,
  verifyAdminIdToken,
} from "@/lib/firebase-admin";
import { ORDER_STATUSES, PAYMENT_STATUSES, type OrderStatus, type PaymentStatus } from "@/lib/orders";
import { eventForOrderStatus, notifyOrderWhatsApp } from "@/lib/whatsapp-notify";

export const runtime = "nodejs";

type Body = {
  orderId?: string;
  orderStatus?: OrderStatus;
  paymentStatus?: PaymentStatus;
  resendWhatsApp?: boolean;
};

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    if (!token) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    if (!isFirebaseAdminConfigured()) {
      return NextResponse.json(
        { error: "Firebase Admin is not configured on the server" },
        { status: 503 },
      );
    }

    try {
      await verifyAdminIdToken(token);
    } catch {
      return NextResponse.json({ error: "Invalid admin session" }, { status: 401 });
    }

    const body = (await request.json()) as Body;
    const orderId = body.orderId?.trim();
    if (!orderId) {
      return NextResponse.json({ error: "orderId required" }, { status: 400 });
    }

    if (body.orderStatus && !ORDER_STATUSES.includes(body.orderStatus)) {
      return NextResponse.json({ error: "Invalid order status" }, { status: 400 });
    }
    if (body.paymentStatus && !PAYMENT_STATUSES.includes(body.paymentStatus)) {
      return NextResponse.json({ error: "Invalid payment status" }, { status: 400 });
    }

    const existing = await getOrderAdmin(orderId);
    if (!existing) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const orderStatusChanged =
      Boolean(body.orderStatus) && body.orderStatus !== existing.orderStatus;
    const paymentBecamePaid =
      body.paymentStatus === "paid" && existing.paymentStatus !== "paid";

    const updated = await updateOrderStatusesAdmin({
      orderId,
      orderStatus: body.orderStatus,
      paymentStatus: body.paymentStatus,
    });

    let whatsapp: Awaited<ReturnType<typeof notifyOrderWhatsApp>> | undefined;
    if (orderStatusChanged && body.orderStatus) {
      whatsapp = await notifyOrderWhatsApp({
        order: updated,
        event: eventForOrderStatus(body.orderStatus),
        force: Boolean(body.resendWhatsApp),
      });
    } else if (paymentBecamePaid || body.resendWhatsApp) {
      whatsapp = await notifyOrderWhatsApp({
        order: updated,
        event: eventForOrderStatus(updated.orderStatus),
        force: Boolean(body.resendWhatsApp),
      });
    }

    return NextResponse.json({ ok: true, order: updated, whatsapp });
  } catch (err) {
    console.error("admin order status failed", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not update order" },
      { status: 500 },
    );
  }
}
