import { NextResponse } from "next/server";
import { markOrderPaidAdmin } from "@/lib/firebase-admin";
import {
  isRazorpayConfigured,
  verifyRazorpaySignature,
} from "@/lib/razorpay-server";
import { lineTotalPaise } from "@/lib/product";
import type { CheckoutDraft, PlacedOrder } from "@/lib/orders";

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
      !draft?.quantity ||
      !draft.contact?.name ||
      !draft.contact?.phone ||
      !draft.address?.line1
    ) {
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
      orderId,
      createdAt: new Date().toISOString(),
      amountPaise: lineTotalPaise(draft.quantity),
      paymentMethod: "razorpay",
      paymentStatus: "paid",
      orderStatus: "confirmed",
      razorpayOrderId,
      razorpayPaymentId,
    };

    try {
      await markOrderPaidAdmin({
        order,
        razorpayOrderId,
        razorpayPaymentId,
      });
    } catch (adminErr) {
      // Payment is valid even if Firestore admin update fails — still return order.
      console.error("firebase admin mark paid failed", adminErr);
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
