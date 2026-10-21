import type { Metadata } from "next";
import { PaymentResponse } from "@/components/checkout/PaymentResponse";

export const metadata: Metadata = {
  title: "Payment response — ICK DEATH",
  description: "HDFC SmartGateway payment result, amount, and transaction id.",
};

/** Same checks as /checkout/response so a success URL alone is not a receipt. */
export default function CheckoutSuccessPage() {
  return <PaymentResponse />;
}
