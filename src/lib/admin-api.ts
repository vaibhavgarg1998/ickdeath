import { withBasePath } from "@/lib/paths";
import type { OrderStatus, PaymentStatus, PlacedOrder } from "@/lib/orders";
import type { NotifyWhatsAppResult } from "@/lib/whatsapp-notify";

function apiUrl(path: string): string {
  const normalized = path.endsWith("/") ? path.slice(0, -1) : path;
  return withBasePath(normalized);
}

export class AdminApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export type AdminOrderStatusResponse = {
  ok: true;
  order: PlacedOrder;
  whatsapp?: NotifyWhatsAppResult;
};

export async function updateAdminOrderStatus(input: {
  token: string;
  orderId: string;
  orderStatus?: OrderStatus;
  paymentStatus?: PaymentStatus;
  resendWhatsApp?: boolean;
}): Promise<AdminOrderStatusResponse> {
  const res = await fetch(apiUrl("/api/admin/orders/status"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${input.token}`,
    },
    body: JSON.stringify({
      orderId: input.orderId,
      orderStatus: input.orderStatus,
      paymentStatus: input.paymentStatus,
      resendWhatsApp: input.resendWhatsApp,
    }),
  });

  const data = (await res.json()) as AdminOrderStatusResponse & { error?: string };
  if (!res.ok || !data.ok) {
    throw new AdminApiError(data.error ?? "Could not update order", res.status);
  }
  return data;
}
