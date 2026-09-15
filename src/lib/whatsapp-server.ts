import crypto from "crypto";
import {
  isNormalizedMobile,
  normalizePhone,
  type WhatsAppOrderEvent,
} from "@/lib/orders";

const GRAPH_VERSION = process.env.WHATSAPP_GRAPH_VERSION?.trim() || "v21.0";

export type WhatsAppSendResult = {
  ok: boolean;
  messageId?: string;
  error?: string;
};

export type WhatsAppTemplateParam = {
  type: "text";
  text: string;
};

function phoneNumberId(): string {
  // Docs use {PHONE_NUMBER_ID} as a placeholder — strip braces if copied through.
  return (process.env.WHATSAPP_PHONE_NUMBER_ID ?? "").replace(/[{}\s]/g, "");
}

export function isWhatsAppConfigured(): boolean {
  return Boolean(process.env.WHATSAPP_TOKEN?.trim() && phoneNumberId());
}

export function getWhatsAppVerifyToken(): string {
  return process.env.WHATSAPP_VERIFY_TOKEN?.trim() ?? "";
}

export function toWhatsAppRecipient(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91") && isNormalizedMobile(digits.slice(2))) {
    return digits;
  }
  const local = normalizePhone(phone);
  if (isNormalizedMobile(local)) return `91${local}`;
  return null;
}

export function publicSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (explicit) return explicit;
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (production) return `https://${production.replace(/^https?:\/\//, "")}`;
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "")}`;
  return "https://ickdeath.com";
}

export function orderTrackHomeUrl(): string {
  return `${publicSiteUrl()}/track/`;
}

export function orderTrackUrl(orderId: string): string {
  return `${publicSiteUrl()}/track/?order=${encodeURIComponent(orderId)}`;
}

export function templateNameForEvent(event: WhatsAppOrderEvent): string {
  const envKey: Record<WhatsAppOrderEvent, string> = {
    confirmed: "WHATSAPP_TEMPLATE_CONFIRMED",
    packed: "WHATSAPP_TEMPLATE_PACKED",
    shipped: "WHATSAPP_TEMPLATE_SHIPPED",
    delivered: "WHATSAPP_TEMPLATE_DELIVERED",
    cancelled: "WHATSAPP_TEMPLATE_CANCELLED",
  };
  const fallback: Record<WhatsAppOrderEvent, string> = {
    confirmed: "ickdeath_order_confirmed",
    packed: "ickdeath_order_packed",
    shipped: "ickdeath_order_shipped",
    delivered: "ickdeath_order_delivered",
    cancelled: "ickdeath_order_cancelled",
  };
  return process.env[envKey[event]]?.trim() || fallback[event];
}

export function templateLanguage(): string {
  return process.env.WHATSAPP_TEMPLATE_LANG?.trim() || "en_US";
}

function messagesUrl(): string {
  const id = phoneNumberId();
  if (!id) {
    throw new Error("WHATSAPP_PHONE_NUMBER_ID is not configured");
  }
  return `https://graph.facebook.com/${GRAPH_VERSION}/${id}/messages`;
}

function authHeaders(): HeadersInit {
  const token = process.env.WHATSAPP_TOKEN?.trim();
  if (!token) throw new Error("WHATSAPP_TOKEN is not configured");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

type GraphMessageResponse = {
  messages?: { id?: string }[];
  error?: { message?: string; code?: number; error_user_msg?: string };
};

async function postMessage(payload: Record<string, unknown>): Promise<WhatsAppSendResult> {
  if (!isWhatsAppConfigured()) {
    return { ok: false, error: "WhatsApp Cloud API is not configured" };
  }

  try {
    const res = await fetch(messagesUrl(), {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    });
    const data = (await res.json()) as GraphMessageResponse;
    if (!res.ok || data.error) {
      const message =
        data.error?.error_user_msg ||
        data.error?.message ||
        `WhatsApp API error (${res.status})`;
      console.error("whatsapp send failed", data.error ?? data);
      return { ok: false, error: message };
    }
    return { ok: true, messageId: data.messages?.[0]?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "WhatsApp send failed";
    console.error("whatsapp send failed", err);
    return { ok: false, error: message };
  }
}

function safeText(value: string): string {
  const trimmed = value.replace(/\s+/g, " ").trim();
  return trimmed || "-";
}

export async function sendWhatsAppTemplate(input: {
  to: string;
  template: string;
  bodyParams?: string[];
}): Promise<WhatsAppSendResult> {
  const to = toWhatsAppRecipient(input.to);
  if (!to) return { ok: false, error: "Invalid WhatsApp number" };

  const components =
    input.bodyParams && input.bodyParams.length > 0
      ? [
          {
            type: "body",
            parameters: input.bodyParams.map(
              (text): WhatsAppTemplateParam => ({ type: "text", text: safeText(text) }),
            ),
          },
        ]
      : [];

  return postMessage({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "template",
    template: {
      name: input.template,
      language: { code: templateLanguage() },
      ...(components.length ? { components } : {}),
    },
  });
}

export async function sendWhatsAppText(input: {
  to: string;
  body: string;
}): Promise<WhatsAppSendResult> {
  const to = toWhatsAppRecipient(input.to);
  if (!to) return { ok: false, error: "Invalid WhatsApp number" };

  return postMessage({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "text",
    text: { preview_url: true, body: input.body.slice(0, 4096) },
  });
}

export async function sendWhatsAppButtons(input: {
  to: string;
  body: string;
  buttons: { id: string; title: string }[];
}): Promise<WhatsAppSendResult> {
  const to = toWhatsAppRecipient(input.to);
  if (!to) return { ok: false, error: "Invalid WhatsApp number" };

  return postMessage({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: input.body.slice(0, 1024) },
      action: {
        buttons: input.buttons.slice(0, 3).map((button) => ({
          type: "reply",
          reply: {
            id: button.id.slice(0, 256),
            title: button.title.slice(0, 20),
          },
        })),
      },
    },
  });
}

export function verifyWhatsAppSignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.WHATSAPP_APP_SECRET?.trim();
  if (!secret) {
    // Unsigned webhooks are accepted only when no app secret is configured (local setup).
    return true;
  }
  if (!signatureHeader?.startsWith("sha256=")) return false;

  const expected = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const received = signatureHeader.slice("sha256=".length);
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(received, "hex"));
  } catch {
    return false;
  }
}
