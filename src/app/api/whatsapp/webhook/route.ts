import { NextResponse } from "next/server";
import {
  isFirebaseAdminConfigured,
  recordWhatsAppDeliveryStatusAdmin,
} from "@/lib/firebase-admin";
import { handleInboundWhatsApp } from "@/lib/whatsapp-inbound";
import {
  getWhatsAppVerifyToken,
  isWhatsAppConfigured,
  verifyWhatsAppSignature,
} from "@/lib/whatsapp-server";
import type { WhatsAppSendStatus } from "@/lib/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type WebhookMessage = {
  id?: string;
  from?: string;
  type?: string;
  text?: { body?: string };
  interactive?: {
    type?: string;
    button_reply?: { id?: string; title?: string };
    list_reply?: { id?: string; title?: string };
  };
  button?: { payload?: string; text?: string };
};

type WebhookStatus = {
  id?: string;
  status?: string;
  recipient_id?: string;
};

type WebhookValue = {
  messages?: WebhookMessage[];
  statuses?: WebhookStatus[];
};

type WebhookBody = {
  object?: string;
  entry?: {
    changes?: {
      value?: WebhookValue;
      field?: string;
    }[];
  }[];
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  const expected = getWhatsAppVerifyToken();

  if (mode === "subscribe" && expected && token === expected && challenge) {
    return new NextResponse(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return NextResponse.json({ error: "Webhook verification failed" }, { status: 403 });
}

export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  if (!verifyWhatsAppSignature(raw, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: WebhookBody = {};
  try {
    body = raw ? (JSON.parse(raw) as WebhookBody) : {};
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.object && body.object !== "whatsapp_business_account") {
    return NextResponse.json({ ok: true });
  }

  try {
    await processWebhook(body);
  } catch (err) {
    console.error("whatsapp webhook handler failed", err);
  }

  return NextResponse.json({ ok: true });
}

async function processWebhook(body: WebhookBody): Promise<void> {
  const values =
    body.entry?.flatMap((entry) => entry.changes?.map((change) => change.value) ?? []) ?? [];

  for (const value of values) {
    if (!value) continue;

    for (const status of value.statuses ?? []) {
      await handleStatus(status);
    }

    if (!isWhatsAppConfigured()) continue;

    for (const message of value.messages ?? []) {
      const inbound = toInbound(message);
      if (!inbound) continue;
      await handleInboundWhatsApp(inbound);
    }
  }
}

function toInbound(message: WebhookMessage): {
  id: string;
  from: string;
  text: string;
  buttonId?: string;
} | null {
  if (!message.id || !message.from) return null;

  if (message.type === "text") {
    const text = message.text?.body?.trim();
    if (!text) return null;
    return { id: message.id, from: message.from, text };
  }

  if (message.type === "interactive") {
    const buttonId =
      message.interactive?.button_reply?.id ?? message.interactive?.list_reply?.id;
    const title =
      message.interactive?.button_reply?.title ?? message.interactive?.list_reply?.title ?? "";
    return {
      id: message.id,
      from: message.from,
      text: title,
      buttonId: buttonId || undefined,
    };
  }

  if (message.type === "button") {
    return {
      id: message.id,
      from: message.from,
      text: message.button?.text ?? "",
      buttonId: message.button?.payload || undefined,
    };
  }

  return null;
}

async function handleStatus(status: WebhookStatus): Promise<void> {
  if (!status.id || !status.status || !isFirebaseAdminConfigured()) return;
  const mapped = mapDeliveryStatus(status.status);
  if (!mapped) return;
  await recordWhatsAppDeliveryStatusAdmin({
    messageId: status.id,
    status: mapped,
  });
}

function mapDeliveryStatus(status: string): WhatsAppSendStatus | null {
  if (status === "sent" || status === "delivered" || status === "read" || status === "failed") {
    return status;
  }
  return null;
}
