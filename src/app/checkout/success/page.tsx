import type { Metadata } from "next";
import { CheckoutSuccessClient } from "./SuccessClient";

export const metadata: Metadata = {
  title: "Order confirmed — ICK DEATH",
  description:
    "Your ICK DEATH order was placed. Track updates on WhatsApp.",
};

export default function CheckoutSuccessPage() {
  return <CheckoutSuccessClient />;
}
