"use client";

import { useState, type FormEvent } from "react";
import { Field } from "@/components/checkout/form-ui";
import { trackButtonClick } from "@/lib/analytics";
import {
  createRestaurantSubscription,
  validateRestaurantSubscription,
  type RestaurantSubscription,
} from "@/lib/restaurant-subscriptions";

const EMPTY = {
  name: "",
  restaurantName: "",
  phone: "",
  email: "",
};

export function RestaurantSubscription() {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<RestaurantSubscription | null>(null);

  function setField(key: keyof typeof EMPTY, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const nextErrors = validateRestaurantSubscription(values);
    setErrors(nextErrors);
    setFormError(null);
    if (Object.keys(nextErrors).length) return;

    setBusy(true);
    try {
      const record = await createRestaurantSubscription(values);
      trackButtonClick("restaurant_subscribe");
      setSaved(record);
      setValues(EMPTY);
    } catch (err) {
      setFormError(messageForError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      id="restaurants"
      className="mx-auto w-full max-w-[1728px] border-t border-white/20 px-4 py-12 sm:px-6 sm:py-16 md:px-10 md:py-24 lg:px-16"
    >
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:gap-16">
        <div>
          <p className="inline-block rounded-full border border-neon/50 bg-neon/15 px-3 py-1 font-[family-name:var(--font-ibm-plex)] text-xs uppercase tracking-[0.2em] text-neon">
            For restaurant owners
          </p>
          <h2 className="mt-3 max-w-xl font-[family-name:var(--font-bebas)] text-[clamp(1.75rem,4.5vw,3.5rem)] leading-[1.05] tracking-wide">
            <span className="text-white">Get ICKDEATH covered with </span>
            <span className="text-neon">monthly subscription</span>
          </h2>
          <p className="mt-4 max-w-xl font-[family-name:var(--font-ibm-plex)] text-base leading-relaxed text-text-soft sm:text-lg">
            Don&apos;t let your customers touch the dirty toilet seat with bare
            hands — be a Touch Generation restaurant. Please fill in your
            details and Team ICKDEATH will connect with you to make you a No
            Touch Generation restaurant.
          </p>
        </div>

        <div className="rounded-2xl border border-neon/40 bg-bg-elevated p-5 sm:p-7">
          {saved ? (
            <div>
              <h3 className="font-[family-name:var(--font-bebas)] text-4xl tracking-wide text-neon">
                Request received
              </h3>
              <p className="mt-3 font-[family-name:var(--font-ibm-plex)] text-sm leading-relaxed text-text-soft">
                We&apos;ll contact {saved.name} at +91 {saved.phone} or{" "}
                {saved.email} about a monthly plan for {saved.restaurantName}.
              </p>
              <p className="mt-4 font-[family-name:var(--font-ibm-plex)] text-xs text-text-dim">
                Reference {saved.id}
              </p>
              <button
                type="button"
                onClick={() => setSaved(null)}
                className="mt-6 inline-flex h-11 items-center border border-white/20 px-4 font-[family-name:var(--font-anton)] text-xs uppercase tracking-wider text-text-dim hover:text-white"
              >
                Submit another restaurant
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate className="space-y-4">
              <Field
                id="restaurant-owner-name"
                label="Your name"
                autoComplete="name"
                value={values.name}
                error={errors.name}
                onChange={(value) => setField("name", value)}
              />
              <Field
                id="restaurant-name"
                label="Restaurant name"
                autoComplete="organization"
                value={values.restaurantName}
                error={errors.restaurantName}
                onChange={(value) => setField("restaurantName", value)}
              />
              <Field
                id="restaurant-phone"
                label="Phone number"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="98XXXXXXXX"
                value={values.phone}
                error={errors.phone}
                onChange={(value) => setField("phone", value)}
              />
              <Field
                id="restaurant-email"
                label="Email"
                type="email"
                autoComplete="email"
                placeholder="you@restaurant.com"
                value={values.email}
                error={errors.email}
                onChange={(value) => setField("email", value)}
              />

              {formError ? (
                <p className="font-[family-name:var(--font-ibm-plex)] text-sm text-red-400">
                  {formError}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={busy}
                className="inline-flex h-12 w-full items-center justify-center bg-neon px-6 font-[family-name:var(--font-anton)] text-sm uppercase tracking-[0.14em] text-bg transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {busy ? "Sending…" : "Request monthly plan"}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

function messageForError(err: unknown): string {
  const raw = err instanceof Error ? err.message : "";
  if (raw.includes("not configured")) {
    return "Signup isn't available right now. Email contact@ickdeath.com.";
  }
  if (raw.toLowerCase().includes("permission")) {
    return "We couldn't save that. Email contact@ickdeath.com and we'll set it up.";
  }
  return "Something went wrong. Try again, or email contact@ickdeath.com.";
}
