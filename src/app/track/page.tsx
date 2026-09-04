import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { TrackOrderClient } from "./TrackClient";

export const metadata: Metadata = {
  title: "Track order — ICK DEATH",
  description:
    "Track your ICK DEATH Seat Safe Tabs order with your order ID or mobile number.",
};

export default function TrackOrderPage() {
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
          <p className="font-[family-name:var(--font-bebas)] text-xl tracking-wide text-neon">
            TRACK ORDER
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-xl px-4 py-10 sm:px-0 sm:py-12">
        <div className="rounded-2xl border border-neon/40 bg-bg-elevated p-6 sm:p-10">
          <Suspense fallback={<TrackFallback />}>
            <TrackOrderClient />
          </Suspense>
        </div>
      </main>
    </div>
  );
}

function TrackFallback() {
  return (
    <p className="font-[family-name:var(--font-ibm-plex)] text-sm text-text-dim">
      Loading tracker…
    </p>
  );
}
