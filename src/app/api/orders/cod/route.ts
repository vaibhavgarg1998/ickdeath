import { NextResponse } from "next/server";
import { CodOrderError, placeCodOrder } from "@/lib/cod-fulfill";
import { browserContextFromRequest, sendVerifiedPurchase } from "@/lib/meta-capi";
import type { CheckoutDraft } from "@/lib/orders";

export const runtime = "nodejs";

type CodBody = {
  draft?: CheckoutDraft;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CodBody;
    if (!body?.draft || typeof body.draft !== "object") {
      return NextResponse.json({ error: "Invalid order" }, { status: 400 });
    }

    const order = await placeCodOrder(body.draft);
    try {
      await sendVerifiedPurchase({
        order,
        amountPaise: order.amountPaise,
        context: browserContextFromRequest(request),
      });
    } catch {
      console.error("meta purchase failed", { orderId: order.orderId });
    }
    return NextResponse.json({ orderId: order.orderId });
  } catch (err) {
    if (err instanceof CodOrderError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("cod order failed", err);
    return NextResponse.json({ error: "Could not place order" }, { status: 500 });
  }
}
