import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { CHECKOUT_PATH, CONTACT_PATH } from "@/lib/buy";

export const metadata: Metadata = {
  title: "About Us — ICK DEATH",
  description:
    "ICK India Pvt. Ltd. makes Seat Safe Tabs, a small tab that lets you lift a toilet seat without touching it.",
};

const facts = [
  {
    title: "What it is",
    body: "A small tab you stick on the edge of a toilet seat. You lift the seat with the tab, not with your hand.",
  },
  {
    title: "Who it's for",
    body: "Households that want a cleaner way to use a shared toilet. The tab is for home use.",
  },
  {
    title: "What's in a pack",
    body: "1 lifter, 1 alcohol wipe, 1 adhesive, and 1 pair of gloves.",
  },
  {
    title: "Editions",
    body: "Barbie, Traveller, Beard, and Peace are limited editions. Simple is the everyday pack. Prices include GST, and delivery is shown at checkout.",
  },
];

export default function AboutPage() {
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
          End the bare hand era
        </h1>
        <p className="mt-6 font-[family-name:var(--font-ibm-plex)] text-base leading-relaxed text-text-soft sm:text-lg">
          ICK DEATH makes Seat Safe Tabs. We started the company so people in
          India could lift a toilet seat without putting a bare hand on it.
          The product is small on purpose: one tab, one wipe, one stick, one
          pair of gloves.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {facts.map((fact) => (
            <section
              key={fact.title}
              className="rounded-2xl border border-white/10 bg-bg-elevated p-5"
            >
              <h2 className="font-[family-name:var(--font-bebas)] text-2xl tracking-wide text-white">
                {fact.title}
              </h2>
              <p className="mt-2 font-[family-name:var(--font-ibm-plex)] text-sm leading-relaxed text-text-soft">
                {fact.body}
              </p>
            </section>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href={CHECKOUT_PATH}
            className="inline-flex h-12 items-center justify-center bg-neon px-6 font-[family-name:var(--font-anton)] text-sm uppercase tracking-[0.14em] text-bg"
          >
            Buy now
          </Link>
          <Link
            href={CONTACT_PATH}
            className="inline-flex h-12 items-center justify-center border border-neon/50 px-6 font-[family-name:var(--font-anton)] text-sm uppercase tracking-[0.14em] text-neon"
          >
            Contact us
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
