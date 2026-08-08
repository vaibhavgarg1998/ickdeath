"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { BuyNowButton } from "@/components/BuyNowButton";

const links = [
  { href: "#product", label: "Product" },
  { href: "#how-to-use", label: "How to use" },
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
        <a
          href="#top"
          className="relative h-12 w-[84px] shrink-0 sm:h-16 sm:w-[112px] md:h-[88px] md:w-[128px] lg:h-[110px] lg:w-[160px]"
          onClick={closeMenu}
        >
          <Image
            src="/assets/logo-header.svg"
            alt="ICK DEATH"
            fill
            className="object-contain object-left"
            priority
          />
        </a>

        <nav className="hidden items-center gap-8 font-[family-name:var(--font-inter)] text-base font-medium text-text-soft md:flex lg:gap-16 lg:text-2xl">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-neon"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <BuyNowButton className="inline-flex h-10 items-center justify-center bg-neon px-3.5 font-[family-name:var(--font-anton)] text-xs uppercase tracking-[0.16em] text-bg-elevated transition-opacity hover:opacity-90 sm:h-11 sm:px-5 sm:text-sm md:h-[66px] md:min-w-[180px] md:px-8 md:text-[28px] lg:min-w-[255px] lg:text-[30px]">
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
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="border-b border-white/10 py-3.5 transition-colors hover:text-neon"
                onClick={closeMenu}
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
