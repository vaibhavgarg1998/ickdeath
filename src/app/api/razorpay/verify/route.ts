import { NextResponse } from "next/server";
import {
  isFirebaseAdminConfigured,
  getOrderAdmin,
  markOrderPaidAdmin,
} from "@/lib/firebase-admin";
import {
  isRazorpayConfigured,
  verifyRazorpaySignature,
} from "@/lib/razorpay-server";
import {
  cartTotalPaise,
  cartTotalQty,
  normalizeCartLines,
} from "@/lib/product";
import type { CheckoutDraft, PlacedOrder } from "@/lib/orders";
import { notifyOrderWhatsApp } from "@/lib/whatsapp-notify";

export const runtime = "nodejs";

type VerifyBody = {
  orderId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  draft?: CheckoutDraft;
};

export async function POST(request: Request) {
  try {
    if (!isRazorpayConfigured()) {
      return NextResponse.json(
        { error: "Razorpay is not configured on the server" },
        { status: 503 },
      );
    }

    const body = (await request.json()) as VerifyBody;
    const {
      orderId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      draft,
    } = body;

    if (
      !orderId ||
      !razorpayOrderId ||
      !razorpayPaymentId ||
      !razorpaySignature ||
      !draft?.contact?.name ||
      !draft.contact?.phone ||
      !draft.address?.line1
    ) {
      return NextResponse.json({ error: "Invalid verify payload" }, { status: 400 });
    }

    const lines = normalizeCartLines(draft.lines, draft.colorway, draft.quantity);
    if (cartTotalQty(lines) < 1) {
      return NextResponse.json({ error: "Invalid verify payload" }, { status: 400 });
    }

    const valid = verifyRazorpaySignature({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    });

    if (!valid) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    const order: PlacedOrder = {
      ...draft,
      lines,
      quantity: cartTotalQty(lines),
      colorway: lines[0]?.colorway ?? draft.colorway,
      orderId,
      createdAt: new Date().toISOString(),
      amountPaise: cartTotalPaise(lines),
      paymentMethod: "razorpay",
      paymentStatus: "paid",
      orderStatus: "confirmed",
      razorpayOrderId,
      razorpayPaymentId,
    };

    // Signature is valid — payment succeeded. Sync Firestore when Admin is configured.
    if (isFirebaseAdminConfigured()) {
      try {
        await markOrderPaidAdmin({
          order,
          razorpayOrderId,
          razorpayPaymentId,
        });
      } catch (adminErr) {
        console.error("firebase admin mark paid failed", adminErr);
        // Do not fail checkout: money was captured; admin can mark paid manually.
      }
    } else {
      console.warn(
        "FIREBASE_ADMIN_* missing or invalid — order stays pending in Firestore until marked paid in admin",
      );
    }

    try {
      let toNotify = order;
      if (isFirebaseAdminConfigured()) {
        const stored = await getOrderAdmin(order.orderId);
        if (stored) {
          toNotify = { ...stored, ...order, whatsapp: stored.whatsapp };
        }
      }
      await notifyOrderWhatsApp({ order: toNotify, event: "confirmed" });
    } catch (waErr) {
      console.error("whatsapp confirmed failed", waErr);
    }

    return NextResponse.json({ ok: true, order });
  } catch (err) {
    console.error("razorpay verify failed", err);
    return NextResponse.json(
      { error: "Could not verify payment" },
      { status: 500 },
    );
  }
}
