import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ABOUT_PATH, TRACK_PATH } from "@/lib/buy";

export const metadata: Metadata = {
  title: "Contact Us — ICK DEATH",
  description:
    "Email ICK India Pvt. Ltd. about a Seat Safe Tabs order.",
};

const EMAIL = "contact@ickdeath.com";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-bg pb-[env(safe-area-inset-bottom)]">
      <Header />
      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <Link
          href="/"
          className="font-[family-name:var(--font-ibm-plex)] text-sm text-text-dim transition-colors hover:text-neon"
        >
          ← Back
        </Link>
        <p className="mt-8 font-[family-name:var(--font-ibm-plex)] text-xs uppercase tracking-[0.2em] text-neon">
          ICK India Pvt. Ltd.
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-bebas)] text-5xl leading-none tracking-wide text-white sm:text-7xl">
          Contact us
        </h1>
        <p className="mt-6 max-w-2xl font-[family-name:var(--font-ibm-plex)] text-base leading-relaxed text-text-soft sm:text-lg">
          Write to us about an order, a delivery, or the product. Include your
          order ID if you have one. It looks like ICK-20261022-1234.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <a
            href="https://www.google.com/maps/search/?api=1&query=F.No.%20G-3%2C%20Plot%20No.%20A-1%2C%20Nandini%20Apartments%2C%20Laxman%20Path%2C%20Sodala%2C%20Shyam%20Nagar%2C%20Jaipur%20302019"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-2xl border border-white/10 bg-bg-elevated p-5 transition-colors hover:border-neon sm:col-span-2"
          >
            <p className="font-[family-name:var(--font-ibm-plex)] text-xs uppercase tracking-[0.16em] text-text-dim">
              Address
            </p>
            <p className="mt-3 font-[family-name:var(--font-ibm-plex)] text-lg leading-relaxed text-white sm:text-xl">
              F.No. G-3, Plot No. A-1, Nandini Apartments
              <br />
              Laxman Path, Sodala, Shyam Nagar
              <br />
              Jaipur - 302019
            </p>
            <p className="mt-2 font-[family-name:var(--font-ibm-plex)] text-sm text-text-soft">
              ICK India Pvt. Ltd.
            </p>
          </a>

          <a
            href={`mailto:${EMAIL}`}
            className="rounded-2xl border border-neon/40 bg-bg-elevated p-5 transition-colors hover:border-neon sm:col-span-2"
          >
            <p className="font-[family-name:var(--font-ibm-plex)] text-xs uppercase tracking-[0.16em] text-text-dim">
              Email
            </p>
            <p className="mt-3 break-all font-[family-name:var(--font-ibm-plex)] text-lg text-white sm:text-xl">
              {EMAIL}
            </p>
            <p className="mt-2 font-[family-name:var(--font-ibm-plex)] text-sm text-text-soft">
              Best for order questions and cancellations before shipping.
            </p>
          </a>
        </div>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href={TRACK_PATH}
            className="inline-flex h-12 items-center justify-center bg-neon px-6 font-[family-name:var(--font-anton)] text-sm uppercase tracking-[0.14em] text-bg"
          >
            Track an order
          </Link>
          <Link
            href={ABOUT_PATH}
            className="inline-flex h-12 items-center justify-center border border-white/20 px-6 font-[family-name:var(--font-anton)] text-sm uppercase tracking-[0.14em] text-text-dim"
          >
            About us
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
