import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Terms & Privacy — ICK DEATH",
  description:
    "Terms, privacy, pricing, cancellation, and refund policy for ICK DEATH Seat Safe Tabs sold by ICK India Pvt. Ltd.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-bg pb-[env(safe-area-inset-bottom)]">
      <header className="border-b border-white/5">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-4 py-4 sm:px-0 sm:py-5">
          <Link
            href="/"
            className="font-[family-name:var(--font-ibm-plex)] text-sm text-text-dim transition-colors hover:text-neon"
          >
            ← Back to product
          </Link>
          <p className="font-[family-name:var(--font-bebas)] text-xl tracking-wide text-neon">
            TERMS & PRIVACY
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-0 sm:py-12">
        <article className="rounded-2xl border border-neon/40 bg-bg-elevated p-6 sm:p-10">
          <h1 className="font-[family-name:var(--font-bebas)] text-3xl tracking-wide text-white sm:text-4xl">
            Terms & Privacy
          </h1>

          <Section title="1. Product Usage">
            <ul>
              <li>
                The Toilet Seat Lifter is intended to provide a hygienic,
                hands-free way to lift and lower compatible toilet seats.
              </li>
              <li>
                The product must be installed and used as per the instructions
                provided.
              </li>
              <li>
                The product is intended for household use unless otherwise
                specified.
              </li>
            </ul>
          </Section>

          <Section title="2. Product Compatibility">
            <ul>
              <li>
                The Toilet Seat Lifter is compatible with most standard toilet
                seats. However, compatibility may vary depending on the design,
                shape, thickness, or material of the toilet seat.
              </li>
              <li>
                Customers are responsible for ensuring compatibility before
                placing an order.
              </li>
            </ul>
          </Section>

          <Section title="3. Orders">
            <ul>
              <li>
                All orders are subject to acceptance and product availability.
              </li>
              <li>
                We reserve the right to cancel or refuse any order due to stock
                unavailability, pricing errors, or suspected fraudulent
                activity.
              </li>
              <li>
                Customers will be notified in case of order cancellation.
              </li>
            </ul>
          </Section>

          <Section title="4. Pricing">
            <ul>
              <li>
                Prices on ickdeath.com are in Indian Rupees. The product price
                includes GST.
              </li>
              <li>
                Delivery is charged per pack and is shown with the product
                price before you pay.
              </li>
              <li>
                The amount you pay is the total shown at checkout. Cash on
                delivery is collected when the order arrives. Online payment
                is collected through HDFC SmartGateway (UPI, cards, or
                netbanking).
              </li>
              <li>
                If a price is shown by mistake, we may cancel the order before
                it ships and refund the amount paid.
              </li>
            </ul>
          </Section>

          <Section title="5. Cancellation">
            <ul>
              <li>
                You can ask us to cancel an order only before it has shipped.
                Email{" "}
                <a
                  href="mailto:contact@ickdeath.com"
                  className="text-neon underline-offset-2 hover:underline"
                >
                  contact@ickdeath.com
                </a>{" "}
                with your order ID.
              </li>
              <li>
                Once an order has shipped, it cannot be cancelled.
              </li>
              <li>
                We may cancel an order before it ships if the product is out of
                stock, the price was wrong, or the order looks fraudulent. We
                will tell you and refund the amount paid.
              </li>
            </ul>
          </Section>

          <Section title="6. Refund">
            <ul>
              <li>
                We do not provide a refund after an order has shipped.
              </li>
              <li>
                A refund is made only when an order is cancelled before it
                ships, or when a payment is taken for an order we do not
                accept.
              </li>
              <li>
                Cash on delivery is not charged online. If we cancel before
                the cash is collected, there is nothing to refund. Refunds for
                online payments are sent to the original payment method. The
                time they take depends on HDFC and your bank.
              </li>
            </ul>
          </Section>

          <Section title="7. Shipping & Delivery">
            <ul>
              <li>
                Delivery timelines are estimates and may vary depending on
                location, courier services, weather conditions, or unforeseen
                circumstances.
              </li>
              <li>
                Once the order has been dispatched, tracking details will be
                shared with the customer.
              </li>
              <li>
                The seller is not responsible for delays caused by courier
                partners or force majeure events.
              </li>
            </ul>
          </Section>

          <Section title="8. Limitation of Liability">
            <ul>
              <li>
                The seller’s liability shall be limited to the purchase price of
                the product.
              </li>
              <li>
                We shall not be liable for any indirect, incidental, special, or
                consequential damages arising from the use or inability to use
                the product.
              </li>
            </ul>
          </Section>

          <Section title="9. Product Information">
            <ul>
              <li>
                Product images are for illustration purposes only. Actual color,
                finish, and dimensions may vary slightly due to manufacturing
                variations and screen settings.
              </li>
              <li>
                We reserve the right to improve or modify the product
                specifications without prior notice.
              </li>
            </ul>
          </Section>

          <Section title="10. Privacy">
            <ul>
              <li>
                Customer information collected during purchase will be used only
                for order processing, shipping, customer support, and other
                purposes outlined in our Privacy Policy.
              </li>
              <li>
                Personal information will not be shared with third parties
                except where required to fulfill the order or comply with legal
                obligations.
              </li>
            </ul>
          </Section>

          <Section title="11. Governing Law">
            <ul>
              <li>
                These terms shall be governed by and interpreted in
                accordance with the laws of India.
              </li>
              <li>
                Any disputes shall be subject to the jurisdiction of the
                competent courts.
              </li>
            </ul>
          </Section>

          <Section title="12. Contact Us">
            <p>
              For any questions regarding your order or product support, please
              contact our customer support team at{" "}
              <a
                href="mailto:contact@ickdeath.com"
                className="text-neon underline-offset-2 hover:underline"
              >
                contact@ickdeath.com
              </a>
              .
            </p>
          </Section>

          <p className="mt-10 border-t border-white/10 pt-6 font-[family-name:var(--font-ibm-plex)] text-xs leading-relaxed text-text-dim">
            © 2026–27 ICK India Pvt. Ltd. All rights reserved.
          </p>
        </article>
      </main>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="font-[family-name:var(--font-bebas)] text-2xl tracking-wide text-white">
        {title}
      </h2>
      <div className="mt-3 space-y-2 font-[family-name:var(--font-ibm-plex)] text-sm leading-relaxed text-text-soft [&_li]:ml-4 [&_li]:list-disc [&_li]:marker:text-neon [&_ul]:mt-2 [&_ul]:space-y-2">
        {children}
      </div>
    </section>
  );
}
