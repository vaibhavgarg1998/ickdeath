import { NextResponse } from "next/server";
import { fulfillHdfcPayment } from "@/lib/hdfc-fulfill";
import { hdfcOrderIdFromPayload, isHdfcWebhookAuthorized } from "@/lib/hdfc-server";

export const runtime = "nodejs";

/** SmartGateway payment notifications. Status is always re-checked with the Order Status API. */
export async function POST(request: Request) {
  if (!isHdfcWebhookAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const hdfcOrderId = hdfcOrderIdFromPayload(await request.json());
    if (!hdfcOrderId) {
      return NextResponse.json({ ok: true, ignored: true });
    }
    await fulfillHdfcPayment(hdfcOrderId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("hdfc webhook failed", err);
    return NextResponse.json({ error: "Could not process webhook" }, { status: 500 });
  }
}
