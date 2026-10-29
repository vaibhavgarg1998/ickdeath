import { NextResponse } from "next/server";
import {
  getOrderAdmin,
  isFirebaseAdminConfigured,
  saveHdfcPaymentAdmin,
} from "@/lib/firebase-admin";
import {
  generateHdfcOrderId,
  getHdfcClient,
  getPaymentPageClientId,
  hdfcReturnUrl,
  isHdfcApiError,
  isHdfcConfigured,
  paiseToRupees,
} from "@/lib/hdfc-server";
import { normalizePhone } from "@/lib/orders";
import { HDFC_CHECKOUT_ENABLED } from "@/lib/payments";
import {
  cartTotalPaise,
  cartTotalQty,
  formatCartLines,
  normalizeCartLines,
  PRODUCT,
} from "@/lib/product";

export const runtime = "nodejs";

type SessionBody = {
  orderId?: string;
};

export async function POST(request: Request) {
  try {
    if (!HDFC_CHECKOUT_ENABLED) {
      return NextResponse.json(
        { error: "HDFC checkout is temporarily unavailable" },
        { status: 503 },
      );
    }
    if (!isHdfcConfigured()) {
      return NextResponse.json(
        { error: "HDFC SmartGateway is not configured on the server" },
        { status: 503 },
      );
    }
    if (!isFirebaseAdminConfigured()) {
      return NextResponse.json(
        { error: "Firebase Admin is not configured" },
        { status: 503 },
      );
    }

    const body = (await request.json()) as SessionBody;
    const orderId = body.orderId?.trim();
    if (!orderId) {
      return NextResponse.json({ error: "Invalid order" }, { status: 400 });
    }

    const order = await getOrderAdmin(orderId);
    if (!order?.contact?.phone || !order.address?.line1) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (order.paymentStatus === "paid") {
      return NextResponse.json({ error: "This order is already paid" }, { status: 409 });
    }

    const lines = normalizeCartLines(order.lines, order.colorway, order.quantity);
    const quantity = cartTotalQty(lines);
    if (quantity < PRODUCT.minQty || quantity > PRODUCT.maxQty) {
      return NextResponse.json({ error: "Invalid order" }, { status: 400 });
    }

    const amountPaise = cartTotalPaise(lines);
    let hdfcOrderId = "";
    let reserved = false;
    for (let attempt = 0; attempt < 5; attempt++) {
      hdfcOrderId = generateHdfcOrderId();
      const saved = await saveHdfcPaymentAdmin({ hdfcOrderId, orderId, amountPaise });
      if (saved.ok) {
        reserved = true;
        break;
      }
      if (saved.reason === "paid") {
        return NextResponse.json({ error: "This order is already paid" }, { status: 409 });
      }
      if (saved.reason === "missing") {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }
    }
    if (!reserved) {
      return NextResponse.json({ error: "Could not start HDFC payment" }, { status: 500 });
    }

    const phone = normalizePhone(order.contact.phone);
    const [firstName, ...rest] = order.contact.name.trim().split(/\s+/);
    const client = await getHdfcClient();
    const session = await client.orderSession.create({
      order_id: hdfcOrderId,
      amount: paiseToRupees(amountPaise),
      currency: "INR",
      payment_page_client_id: getPaymentPageClientId(),
      action: "paymentPage",
      return_url: hdfcReturnUrl(request),
      customer_id: phone,
      customer_phone: phone,
      customer_email: order.contact.email || undefined,
      first_name: firstName || undefined,
      last_name: rest.join(" ") || undefined,
      description: formatCartLines(lines).slice(0, 120),
      udf6: orderId,
    });

    const paymentLink = session.payment_links?.web;
    if (typeof paymentLink !== "string" || !paymentLink.startsWith("https://")) {
      console.error("hdfc session missing payment link", hdfcOrderId);
      return NextResponse.json(
        { error: "Could not open HDFC checkout" },
        { status: 502 },
      );
    }

    return NextResponse.json({ paymentLink, orderId, hdfcOrderId });
  } catch (err) {
    console.error("hdfc session failed", err);
    const message =
      err instanceof Error && err.message
        ? err.message
        : "Could not start HDFC payment";
    return NextResponse.json(
      { error: message.slice(0, 300) },
      { status: isHdfcApiError(err) ? 502 : 500 },
    );
  }
}
