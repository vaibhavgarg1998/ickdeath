import type { Metadata } from "next";
import { PaymentResponse } from "@/components/checkout/PaymentResponse";

export const metadata: Metadata = {
  title: "Payment response — ICK DEATH",
  description: "HDFC SmartGateway payment result, amount, and transaction id.",
};

export default function PaymentResponsePage() {
  return <PaymentResponse />;
}
