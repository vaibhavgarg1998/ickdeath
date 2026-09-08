import type { Metadata } from "next";
import Link from "next/link";
import { CheckoutWizard } from "@/components/checkout/CheckoutWizard";

export const metadata: Metadata = {
  title: "Checkout — ICK DEATH",
  description:
    "Buy Seat Safe Tabs directly from ickdeath.com. Guest checkout with WhatsApp order updates.",
};

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-bg pb-[env(safe-area-inset-bottom)]">
      <header className="border-b border-white/5">
        <div className="mx-auto flex w-full max-w-xl items-center justify-between px-4 py-4 sm:px-0 sm:py-5">
          <Link
            href="/"
            className="font-[family-name:var(--font-ibm-plex)] text-sm text-text-dim transition-colors hover:text-neon"
          >
            ← Back to product
          </Link>
          <div className="text-right">
            <p className="font-[family-name:var(--font-bebas)] text-xl tracking-wide text-neon">
              CHECKOUT
            </p>
            <p className="mt-0.5 font-[family-name:var(--font-ibm-plex)] text-[10px] uppercase tracking-[0.16em] text-text-dim">
              Payment partner Razorpay
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-xl px-4 py-8 sm:px-0 sm:py-10">
        <CheckoutWizard />
      </main>
    </div>
  );
}
