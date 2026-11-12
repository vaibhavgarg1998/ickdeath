import { NextResponse } from "next/server";
import {
  browserContextFromRequest,
  metaCapiConfigured,
  metaTestEventCode,
  sendMetaEvent,
} from "@/lib/meta-capi";
import {
  isCustomMetaEvent,
  isMetaEventId,
  isStandardMetaEvent,
  sanitizeMetaCustomData,
  sanitizeMetaUserInput,
} from "@/lib/meta-events";

export const runtime = "nodejs";

type EventBody = {
  eventName?: unknown;
  eventId?: unknown;
  customData?: unknown;
  userData?: unknown;
  eventTime?: unknown;
  eventSourceUrl?: unknown;
  fbp?: unknown;
  fbc?: unknown;
};

function devBody(result: { ok: boolean; reason?: string; eventsReceived?: number }) {
  if (process.env.NODE_ENV === "production") return { ok: result.ok };
  return {
    ok: result.ok,
    ...(result.reason ? { reason: result.reason } : {}),
    ...(result.eventsReceived != null ? { eventsReceived: result.eventsReceived } : {}),
  };
}

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({
    configured: metaCapiConfigured(),
    testEvents: Boolean(metaTestEventCode()),
  });
}

export async function POST(request: Request) {
  let text = "";
  try {
    text = await request.text();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (text.length > 8000) {
    return NextResponse.json({ ok: false }, { status: 413 });
  }

  let body: EventBody;
  try {
    body = JSON.parse(text) as EventBody;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const eventName = typeof body.eventName === "string" ? body.eventName : "";
  const eventId = typeof body.eventId === "string" ? body.eventId : "";
  if (eventName === "Purchase" || eventName.toLowerCase() === "purchase") {
    return NextResponse.json(devBody({ ok: false, reason: "invalid_event" }), { status: 400 });
  }
  if (!isStandardMetaEvent(eventName) && !isCustomMetaEvent(eventName)) {
    return NextResponse.json(devBody({ ok: false, reason: "invalid_event" }), { status: 400 });
  }
  if (!isMetaEventId(eventId)) {
    return NextResponse.json(devBody({ ok: false, reason: "invalid_event" }), { status: 400 });
  }

  const context = browserContextFromRequest(request, {
    fbp: body.fbp,
    fbc: body.fbc,
    eventSourceUrl: body.eventSourceUrl,
  });
  if (!context.eventSourceUrl) {
    return NextResponse.json(devBody({ ok: false, reason: "invalid_event" }), { status: 400 });
  }

  const result = await sendMetaEvent({
    eventName,
    eventId,
    eventTime: body.eventTime,
    customData: sanitizeMetaCustomData(body.customData),
    user: sanitizeMetaUserInput(body.userData),
    context,
  });

  if (!result.ok && result.reason === "no_user_data") {
    return NextResponse.json(devBody(result));
  }
  if (!result.ok && result.reason === "not_configured") {
    return NextResponse.json(devBody(result), { status: 503 });
  }
  if (!result.ok && (result.reason === "meta_rejected" || result.reason === "timeout" || result.reason === "unavailable")) {
    return NextResponse.json(devBody(result), { status: 502 });
  }
  if (!result.ok) {
    return NextResponse.json(devBody(result), { status: 400 });
  }
  return NextResponse.json(devBody(result));
}
