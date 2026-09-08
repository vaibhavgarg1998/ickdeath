import {
  ORDER_ID_PATTERN,
  normalizeOrderId,
  parseTrackQuery,
  type PublicTrackedOrder,
} from "@/lib/orders";
import {
  claimWhatsAppInboundAdmin,
  findOrdersForTracking,
  getWhatsAppSessionAdmin,
  isFirebaseAdminConfigured,
  setWhatsAppSessionAdmin,
} from "@/lib/firebase-admin";
import { formatINR } from "@/lib/product";
import {
  orderTrackHomeUrl,
  orderTrackUrl,
  sendWhatsAppButtons,
  sendWhatsAppText,
} from "@/lib/whatsapp-server";

type InboundMessage = {
  id: string;
  from: string;
  text: string;
  buttonId?: string;
};

const HELP_IDS = new Set(["help", "human", "agent"]);

function statusLine(order: PublicTrackedOrder): string {
  const pay =
    order.paymentStatus === "paid"
      ? "Paid"
      : order.paymentStatus === "failed"
        ? "Payment failed"
        : "Payment pending";
  const fulfill =
    order.orderStatus === "cancelled"
      ? "Cancelled"
      : order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1);
  return [
    `*${order.orderId}*`,
    `${order.productName} × ${order.quantity} — ${formatINR(order.amountPaise)}`,
    `Status: ${fulfill} · ${pay}`,
    `Track: ${orderTrackUrl(order.orderId)}`,
  ].join("\n");
}

function latestOrdersCopy(orders: PublicTrackedOrder[]): string {
  if (orders.length === 1) {
    return `Here's your ICK DEATH order:\n\n${statusLine(orders[0]!)}`;
  }
  const top = orders.slice(0, 5).map(statusLine).join("\n\n");
  return `Here are your latest ICK DEATH orders:\n\n${top}`;
}

function extractOrderId(text: string): string | null {
  const match = text.toUpperCase().match(/ICK-\d{8}-\d{4}/);
  if (!match) return null;
  const orderId = normalizeOrderId(match[0]);
  return ORDER_ID_PATTERN.test(orderId) ? orderId : null;
}

function wantsHuman(text: string, buttonId?: string): boolean {
  if (buttonId && HELP_IDS.has(buttonId.toLowerCase())) return true;
  return /\b(help|human|agent|support|person)\b/i.test(text);
}

export async function handleInboundWhatsApp(message: InboundMessage): Promise<void> {
  if (!isFirebaseAdminConfigured()) {
    console.warn("whatsapp inbound skipped — Firebase Admin is not configured");
    return;
  }

  const claimed = await claimWhatsAppInboundAdmin(message.id);
  if (!claimed) return;

  const from = message.from;
  const text = message.text.trim();
  const buttonId = message.buttonId?.toLowerCase();

  if (wantsHuman(text, buttonId)) {
    await setWhatsAppSessionAdmin({ waId: from, autoReply: false });
    await sendWhatsAppText({
      to: from,
      body: "Got it — a person from ICK DEATH will reply here. You can also email hello@ickdeath.com.\n\nIf you share an order ID (ICK-…) I'll still look it up instantly.",
    });
    return;
  }

  const orderId = extractOrderId(text);
  if (orderId) {
    const orders = await findOrdersForTracking({ kind: "orderId", orderId });
    if (orders.length === 0) {
      await sendWhatsAppText({
        to: from,
        body: `I couldn't find order *${orderId}*. Check the ID on your confirmation message, or visit ${orderTrackHomeUrl()}`,
      });
      return;
    }
    await sendWhatsAppButtons({
      to: from,
      body: `${statusLine(orders[0]!)}\n\nNeed a person? Tap Help.`,
      buttons: [
        { id: "track", title: "Track order" },
        { id: "help", title: "Talk to us" },
      ],
    });
    return;
  }

  const parsed = parseTrackQuery(text);
  if (parsed.kind === "phone") {
    const orders = await findOrdersForTracking(parsed);
    if (orders.length === 0) {
      await sendWhatsAppText({
        to: from,
        body: "No orders found for that number. Send your order ID (ICK-…) or the WhatsApp number used at checkout.",
      });
      return;
    }
    await sendWhatsAppButtons({
      to: from,
      body: `${latestOrdersCopy(orders)}\n\nNeed a person? Tap Help.`,
      buttons: [
        { id: "track", title: "Track order" },
        { id: "help", title: "Talk to us" },
      ],
    });
    return;
  }

  const session = await getWhatsAppSessionAdmin(from);
  if (session && session.autoReply === false && buttonId !== "track") {
    return;
  }

  const fromOrders = await findOrdersForTracking({
    kind: "phone",
    phone: from.replace(/\D/g, "").slice(-10),
  });

  if (fromOrders.length > 0) {
    await sendWhatsAppButtons({
      to: from,
      body: `${latestOrdersCopy(fromOrders)}\n\nSend another order ID anytime, or tap Help to talk to us.`,
      buttons: [
        { id: "track", title: "Track order" },
        { id: "help", title: "Talk to us" },
      ],
    });
    return;
  }

  if (buttonId === "track") {
    await sendWhatsAppText({
      to: from,
      body: `Send your order ID (looks like ICK-20260908-1234) or the 10-digit WhatsApp number used at checkout.\n\nYou can also track here: ${orderTrackHomeUrl()}`,
    });
    return;
  }

  await sendWhatsAppButtons({
    to: from,
    body: `Hi, this is ICK DEATH. Send your order ID (ICK-…) or the WhatsApp number used at checkout and I'll share the status.\n\nOr track online: ${orderTrackHomeUrl()}`,
    buttons: [
      { id: "track", title: "Track order" },
      { id: "help", title: "Talk to us" },
    ],
  });
}
