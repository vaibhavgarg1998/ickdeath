import {
  type OrderStatus,
  type OrderWhatsApp,
  type PlacedOrder,
  type WhatsAppOrderEvent,
} from "@/lib/orders";
import { productNameForColorway } from "@/lib/product";
import {
  isFirebaseAdminConfigured,
  recordWhatsAppOnOrderAdmin,
} from "@/lib/firebase-admin";
import {
  isWhatsAppConfigured,
  orderTrackUrl,
  sendWhatsAppTemplate,
  templateNameForEvent,
} from "@/lib/whatsapp-server";

export type NotifyWhatsAppResult = {
  sent: boolean;
  skipped?: string;
  error?: string;
  messageId?: string;
  template?: string;
  event?: WhatsAppOrderEvent;
};

function firstName(name: string): string {
  const part = name.trim().split(/\s+/)[0];
  return part || "there";
}

export function eventForOrderStatus(status: OrderStatus): WhatsAppOrderEvent {
  if (status === "packed") return "packed";
  if (status === "shipped") return "shipped";
  if (status === "delivered") return "delivered";
  if (status === "cancelled") return "cancelled";
  return "confirmed";
}

function amountForTemplate(paise: number): string {
  return `Rs ${Math.round(paise / 100)}`;
}

function bodyParamsForEvent(order: PlacedOrder, event: WhatsAppOrderEvent): string[] {
  const name = firstName(order.contact.name);
  const qtyLine = `${order.quantity}x ${productNameForColorway(order.colorway)}`;
  const amount = amountForTemplate(order.amountPaise);

  switch (event) {
    case "confirmed":
      return [name, order.orderId, qtyLine, amount];
    case "packed":
      return [name, order.orderId];
    case "shipped":
      return [name, order.orderId, orderTrackUrl(order.orderId)];
    case "delivered":
      return [name, order.orderId];
    case "cancelled":
      return [name, order.orderId];
  }
}

function alreadySent(whatsapp: OrderWhatsApp | undefined, event: WhatsAppOrderEvent): boolean {
  return Boolean(whatsapp?.eventsSent?.includes(event));
}

export async function notifyOrderWhatsApp(input: {
  order: PlacedOrder;
  event: WhatsAppOrderEvent;
  force?: boolean;
}): Promise<NotifyWhatsAppResult> {
  const { order, event, force } = input;

  if (!isWhatsAppConfigured()) {
    return { sent: false, skipped: "WhatsApp Cloud API is not configured", event };
  }

  if (!force && alreadySent(order.whatsapp, event)) {
    return { sent: false, skipped: `Already sent ${event} update`, event };
  }

  const template = templateNameForEvent(event);
  const result = await sendWhatsAppTemplate({
    to: order.contact.phone,
    template,
    bodyParams: bodyParamsForEvent(order, event),
  });

  if (isFirebaseAdminConfigured()) {
    try {
      await recordWhatsAppOnOrderAdmin({
        orderId: order.orderId,
        event,
        template,
        messageId: result.messageId,
        status: result.ok ? "accepted" : "failed",
        error: result.error,
      });
    } catch (err) {
      console.error("whatsapp persist failed", err);
    }
  }

  if (!result.ok) {
    return { sent: false, error: result.error, template, event };
  }

  return { sent: true, messageId: result.messageId, template, event };
}
