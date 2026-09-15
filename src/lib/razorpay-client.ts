import type { CheckoutDraft, PlacedOrder } from "@/lib/orders";
import { apiUrl, readApiJson } from "@/lib/api";

export type RazorpayCreateResponse = {
  keyId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  orderId: string;
  productName: string;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
};

type RazorpaySuccessResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayCheckoutOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme: { color: string };
  handler: (response: RazorpaySuccessResponse) => void;
  modal?: { ondismiss?: () => void };
};

type RazorpayInstance = {
  open: () => void;
  on: (event: string, handler: (response: { error: { description?: string } }) => void) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayInstance;
  }
}

export async function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (window.Razorpay) return true;

  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export async function createRazorpayOrder(input: {
  orderId: string;
  draft: CheckoutDraft;
}): Promise<RazorpayCreateResponse> {
  const res = await fetch(apiUrl("/api/razorpay/create-order"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      orderId: input.orderId,
      quantity: input.draft.quantity,
      customerName: input.draft.contact.name,
      customerEmail: input.draft.contact.email,
      customerPhone: input.draft.contact.phone,
    }),
  });

  const data = await readApiJson<RazorpayCreateResponse & { error?: string }>(res);
  if (!res.ok) {
    throw new Error(data.error ?? "Could not start Razorpay payment");
  }
  return data;
}

export async function verifyRazorpayPayment(input: {
  orderId: string;
  draft: CheckoutDraft;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): Promise<PlacedOrder> {
  const res = await fetch(apiUrl("/api/razorpay/verify"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const data = await readApiJson<{ order?: PlacedOrder; error?: string }>(res);
  if (!res.ok || !data.order) {
    throw new Error(data.error ?? "Payment verification failed");
  }
  return data.order;
}

/** Best-effort — updates admin live payment status when checkout fails. */
export async function markRazorpayPaymentFailed(orderId: string): Promise<void> {
  try {
    await fetch(apiUrl("/api/razorpay/mark-failed"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });
  } catch {
    // Non-blocking for the customer checkout UX.
  }
}

export function openRazorpayCheckout(input: {
  create: RazorpayCreateResponse;
  onSuccess: (response: RazorpaySuccessResponse) => void;
  onDismiss: () => void;
  onFailure: (message: string) => void;
}): void {
  if (!window.Razorpay) {
    input.onFailure("Razorpay failed to load");
    return;
  }

  const rzp = new window.Razorpay({
    key: input.create.keyId,
    amount: input.create.amount,
    currency: input.create.currency,
    name: "ICK DEATH",
    description: input.create.productName,
    order_id: input.create.razorpayOrderId,
    prefill: input.create.prefill,
    theme: { color: "#c1ef04" },
    handler: input.onSuccess,
    modal: { ondismiss: input.onDismiss },
  });

  rzp.on("payment.failed", (response) => {
    input.onFailure(response.error?.description ?? "Payment failed");
  });

  rzp.open();
}
