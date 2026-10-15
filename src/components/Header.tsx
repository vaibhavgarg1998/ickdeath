"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BuyNowButton } from "@/components/BuyNowButton";
import { Logo } from "@/components/Logo";
import { trackButtonClick, type TrackedButtonId } from "@/lib/analytics";
import { TRACK_PATH } from "@/lib/buy";
import { withBasePath } from "@/lib/paths";

const links: {
  href: string;
  label: string;
  trackId: TrackedButtonId;
}[] = [
  {
    href: `${withBasePath("/")}#product`,
    label: "Product",
    trackId: "nav_product",
  },
  {
    href: `${withBasePath("/")}#how-to-use`,
    label: "How to use",
    trackId: "nav_how_to_use",
  },
  {
    href: TRACK_PATH,
    label: "Track order",
    trackId: "nav_track_order",
  },
];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-bg/95 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[1728px] items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4 md:px-10 lg:px-16 lg:py-5">
        <Link
          href="/"
          className="relative block size-12 shrink-0 sm:size-16 md:size-20 lg:size-24"
          onClick={closeMenu}
        >
          <Logo className="size-full" />
        </Link>

        <nav className="hidden items-center gap-8 font-[family-name:var(--font-inter)] text-base font-medium text-text-soft md:flex lg:gap-12 lg:text-lg">
          {links.map((link) =>
            link.href === TRACK_PATH ? (
              <Link
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-neon"
                onClick={() => trackButtonClick(link.trackId)}
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-neon"
                onClick={() => trackButtonClick(link.trackId)}
              >
                {link.label}
              </a>
            ),
          )}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <BuyNowButton
            trackId="header_buy_now"
            className="inline-flex h-10 items-center justify-center bg-neon px-3.5 font-[family-name:var(--font-anton)] text-xs uppercase tracking-[0.08em] text-bg-elevated transition-opacity hover:opacity-90 sm:h-11 sm:px-5 sm:text-sm md:h-14 md:min-w-[160px] md:px-6 md:text-xl lg:min-w-[200px] lg:text-2xl"
          >
            Buy Now
          </BuyNowButton>

          <button
            type="button"
            className="inline-flex size-10 items-center justify-center border border-neon/60 text-neon md:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="relative block size-5">
              <span
                className={`absolute left-0 block h-0.5 w-5 bg-current transition-transform ${
                  menuOpen ? "top-1/2 -translate-y-1/2 rotate-45" : "top-1"
                }`}
              />
              <span
                className={`absolute left-0 top-1/2 block h-0.5 w-5 -translate-y-1/2 bg-current transition-opacity ${
                  menuOpen ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`absolute left-0 block h-0.5 w-5 bg-current transition-transform ${
                  menuOpen ? "top-1/2 -translate-y-1/2 -rotate-45" : "bottom-1"
                }`}
              />
            </span>
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div
          id="mobile-nav"
          className="border-t border-white/10 bg-bg px-4 pb-5 pt-3 md:hidden"
        >
          <nav className="flex flex-col gap-1 font-[family-name:var(--font-inter)] text-lg font-medium text-text-soft">
            {links.map((link) =>
              link.href === TRACK_PATH ? (
                <Link
                  key={link.href}
                  href={link.href}
                  className="border-b border-white/10 py-3.5 transition-colors hover:text-neon"
                  onClick={() => {
                    trackButtonClick(link.trackId);
                    closeMenu();
                  }}
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  className="border-b border-white/10 py-3.5 transition-colors hover:text-neon"
                  onClick={() => {
                    trackButtonClick(link.trackId);
                    closeMenu();
                  }}
                >
                  {link.label}
                </a>
              ),
            )}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
