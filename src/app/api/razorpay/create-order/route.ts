import { NextResponse } from "next/server";
import {
  cartTotalPaise,
  cartTotalQty,
  formatCartLines,
  normalizeCartLines,
  PRODUCT,
} from "@/lib/product";
import {
  getRazorpayClient,
  getRazorpayKeyId,
  isRazorpayConfigured,
} from "@/lib/razorpay-server";

export const runtime = "nodejs";

type CreateBody = {
  orderId?: string;
  quantity?: number;
  colorway?: string;
  lines?: unknown;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
};

export async function POST(request: Request) {
  try {
    if (!isRazorpayConfigured()) {
      return NextResponse.json(
        { error: "Razorpay is not configured on the server" },
        { status: 503 },
      );
    }

    const body = (await request.json()) as CreateBody;
    const orderId = body.orderId?.trim();
    const lines = normalizeCartLines(body.lines, body.colorway, body.quantity);
    const quantity = cartTotalQty(lines);

    if (
      !orderId ||
      quantity < PRODUCT.minQty ||
      quantity > PRODUCT.maxQty
    ) {
      return NextResponse.json({ error: "Invalid order payload" }, { status: 400 });
    }

    const amount = cartTotalPaise(lines);
    const productName = formatCartLines(lines);
    const razorpay = getRazorpayClient();

    const rzOrder = await razorpay.orders.create({
      amount,
      currency: PRODUCT.currency,
      receipt: orderId.slice(0, 40),
      notes: {
        ickOrderId: orderId,
        productId: PRODUCT.id,
        quantity: String(quantity),
        colorway: lines[0]?.colorway ?? body.colorway ?? "",
        lines: productName.slice(0, 500),
        customerName: body.customerName ?? "",
        customerPhone: body.customerPhone ?? "",
      },
    });

    return NextResponse.json({
      keyId: getRazorpayKeyId(),
      razorpayOrderId: rzOrder.id,
      amount: rzOrder.amount,
      currency: rzOrder.currency,
      orderId,
      productName,
      prefill: {
        name: body.customerName ?? "",
        email: body.customerEmail ?? "",
        contact: body.customerPhone ?? "",
      },
    });
  } catch (err) {
    console.error("razorpay create-order failed", err);
    return NextResponse.json(
      { error: "Could not create payment order" },
      { status: 500 },
    );
  }
}
