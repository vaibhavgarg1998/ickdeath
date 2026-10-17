import { NextResponse } from "next/server";
import { fulfillHdfcPayment } from "@/lib/hdfc-fulfill";
import { appUrl, hdfcOrderIdFromPayload } from "@/lib/hdfc-server";

export const runtime = "nodejs";

async function gatewayOrderId(request: Request): Promise<string | null> {
  const url = new URL(request.url);
  const fromQuery = url.searchParams.get("order_id") ?? url.searchParams.get("orderId");
  const contentType = request.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("application/json")) {
      return hdfcOrderIdFromPayload(await request.json()) ?? fromQuery;
    }
    const form = await request.formData();
    const value = form.get("order_id") ?? form.get("orderId");
    if (typeof value === "string" && value.trim()) return value.trim();
  } catch (err) {
    console.error("hdfc return body", err);
  }

  return fromQuery?.trim() || null;
}

function redirectFor(
  request: Request,
  outcome: "paid" | "pending" | "failed" | "cancelled" | "mismatch",
  orderId: string | null,
): NextResponse {
  if (outcome === "paid" && orderId) {
    const url = new URL(appUrl(request, "/checkout/success/"));
    url.searchParams.set("order", orderId);
    return NextResponse.redirect(url, 303);
  }

  const payment =
    outcome === "pending" ? "pending" : outcome === "mismatch" ? "review" : outcome === "cancelled" ? "cancelled" : "failed";
  const url = new URL(appUrl(request, "/checkout/"));
  url.searchParams.set("payment", payment);
  if (orderId) url.searchParams.set("order", orderId);
  return NextResponse.redirect(url, 303);
}

/** SmartGateway POSTs the customer here after the payment page. */
export async function POST(request: Request) {
  try {
    const hdfcOrderId = await gatewayOrderId(request);
    if (!hdfcOrderId) {
      return redirectFor(request, "failed", null);
    }
    const result = await fulfillHdfcPayment(hdfcOrderId);
    return redirectFor(request, result.outcome, result.orderId);
  } catch (err) {
    console.error("hdfc return failed", err);
    return redirectFor(request, "failed", null);
  }
}
