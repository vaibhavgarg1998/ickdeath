import { NextResponse } from "next/server";
import { fulfillHdfcPayment } from "@/lib/hdfc-fulfill";
import { appUrl, hdfcOrderIdFromPayload, verifyHdfcReturnSignature } from "@/lib/hdfc-server";

export const runtime = "nodejs";

function addParams(target: Record<string, string>, source: Record<string, string>) {
  for (const [key, value] of Object.entries(source)) {
    if (value) target[key] = value;
  }
}

async function readReturn(request: Request): Promise<{
  orderId: string | null;
  signatureOk: boolean;
}> {
  const url = new URL(request.url);
  const params: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });

  const contentType = request.headers.get("content-type") ?? "";
  try {
    const raw = await request.text();
    if (!raw) {
      // Query string only.
    } else if (contentType.includes("application/json")) {
      const body = JSON.parse(raw) as Record<string, unknown>;
      for (const [key, value] of Object.entries(body)) {
        if (typeof value === "string") params[key] = value;
      }
    } else {
      const form = new URLSearchParams(raw);
      const parsed: Record<string, string> = {};
      form.forEach((value, key) => {
        parsed[key] = value;
      });
      addParams(params, parsed);
    }
  } catch (err) {
    console.error("hdfc return body", err);
  }

  const orderId =
    params.order_id?.trim() ||
    params.orderId?.trim() ||
    hdfcOrderIdFromPayload(params);
  return { orderId, signatureOk: verifyHdfcReturnSignature(params) };
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

async function handleReturn(request: Request) {
  try {
    const { orderId: hdfcOrderId, signatureOk } = await readReturn(request);
    if (!signatureOk) {
      console.error("hdfc return signature mismatch", hdfcOrderId);
    }
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

/** SmartGateway sends the customer here after the payment page. */
export async function POST(request: Request) {
  return handleReturn(request);
}

export async function GET(request: Request) {
  return handleReturn(request);
}
