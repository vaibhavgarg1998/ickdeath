import type { Metadata } from "next";
import { PaymentResponse } from "@/components/checkout/PaymentResponse";

export const metadata: Metadata = {
  title: "Order confirmation — ICK DEATH",
  description: "Cash on delivery confirmation, or the HDFC payment result when online checkout is on.",
};

/** Same checks as /checkout/response so a success URL alone is not a receipt. */
export default function CheckoutSuccessPage() {
  return <PaymentResponse />;
}
