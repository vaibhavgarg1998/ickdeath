import type { PlacedOrder } from "@/lib/orders";
import { formatOrderItems, PRODUCT } from "@/lib/product";

/** Best-effort notify for an external orders inbox. Never blocks checkout. */
export async function postOrdersWebhook(order: PlacedOrder): Promise<void> {
  const url = process.env.NEXT_PUBLIC_ORDERS_WEBHOOK_URL ?? "";
  if (!url) return;

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...order,
        productId: PRODUCT.id,
        productName: formatOrderItems(order),
        source: "ickdeath-website",
      }),
    });
  } catch {
    // Webhook is best-effort.
  }
}
