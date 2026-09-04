import { NextResponse } from "next/server";
import {
  findOrdersForTracking,
  isFirebaseAdminConfigured,
} from "@/lib/firebase-admin";
import { parseTrackQuery } from "@/lib/orders";

export const runtime = "nodejs";

type TrackBody = {
  query?: string;
};

export async function POST(request: Request) {
  try {
    if (!isFirebaseAdminConfigured()) {
      return NextResponse.json(
        { error: "Order tracking is not configured on the server" },
        { status: 503 },
      );
    }

    const body = (await request.json()) as TrackBody;
    const parsed = parseTrackQuery(body.query ?? "");
    if (parsed.kind === "invalid") {
      return NextResponse.json({ error: parsed.message }, { status: 400 });
    }

    const orders = await findOrdersForTracking(parsed);
    return NextResponse.json({ orders });
  } catch (err) {
    console.error("order track failed", err);
    return NextResponse.json(
      { error: "Could not look up your order" },
      { status: 500 },
    );
  }
}
