import { NextResponse } from "next/server";
import {
  isFirebaseAdminConfigured,
  markOrderPaymentStatusAdmin,
} from "@/lib/firebase-admin";

export const runtime = "nodejs";

type Body = {
  orderId?: string;
};

/** Best-effort: mark a pending order as payment failed (admin live view). */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    const orderId = body.orderId?.trim();
    if (!orderId) {
      return NextResponse.json({ error: "orderId required" }, { status: 400 });
    }

    if (!isFirebaseAdminConfigured()) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    await markOrderPaymentStatusAdmin({
      orderId,
      paymentStatus: "failed",
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("razorpay mark-failed", err);
    return NextResponse.json({ error: "Could not update payment status" }, { status: 500 });
  }
}
