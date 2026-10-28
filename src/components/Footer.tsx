import Link from "next/link";
import { AssetImage } from "@/components/AssetImage";
import { Logo } from "@/components/Logo";
import { ABOUT_PATH, AMAZON_URL, CONTACT_PATH, TERMS_PATH } from "@/lib/buy";
import { withBasePath } from "@/lib/paths";

const socials = [
  {
    href: "https://www.instagram.com/ickdeath",
    src: "/assets/icon-instagram.svg",
    label: "Instagram",
  },
  // {
  //   href: FLIPKART_URL,
  //   src: "/assets/icon-web.png",
  //   label: "Buy on Flipkart",
  // },
  {
    href: AMAZON_URL,
    src: "/assets/icon-amazon.svg",
    label: "Buy on Amazon",
  },
];

export function Footer() {
  return (
    <footer className="relative mt-8 overflow-hidden rounded-t-[28px] border-y-2 border-neon bg-black sm:mt-10 sm:rounded-t-[40px] md:rounded-t-[50px]">
      <div className="mx-auto flex w-full max-w-[1728px] flex-col items-center gap-8 px-4 py-12 sm:gap-10 sm:px-6 sm:py-16 md:flex-row md:justify-between md:px-10 lg:px-16 lg:py-24">
        <div className="relative size-24 shrink-0 sm:size-32 md:size-40 lg:size-48">
          <Logo className="size-full" />
        </div>

        <div className="flex flex-col items-center gap-4 text-center font-[family-name:var(--font-inter)] text-base font-semibold text-white sm:gap-6 sm:text-lg md:flex-row md:gap-10 lg:gap-16 lg:text-[22px]">
          <Link href={ABOUT_PATH} className="transition-colors hover:text-neon">
            About Us
          </Link>
          <Link href={CONTACT_PATH} className="transition-colors hover:text-neon">
            Contact Us
          </Link>
          <a
            href={`${withBasePath("/")}#restaurants`}
            className="transition-colors hover:text-neon"
          >
            Restaurants
          </a>
          <Link href={TERMS_PATH} className="transition-colors hover:text-neon">
            Terms & Privacy
          </Link>
        </div>

        <div className="flex items-center gap-5 sm:gap-6">
          {socials.map((social) => (
            <a
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className="relative size-11 shrink-0 overflow-hidden sm:size-12 md:size-[53px]"
              aria-label={social.label}
            >
              <AssetImage
                src={social.src}
                alt=""
                fill
                className="object-contain"
              />
            </a>
          ))}
        </div>
      </div>

      <p className="px-4 pb-8 text-center font-[family-name:var(--font-inter)] text-xs leading-relaxed text-text-dim sm:text-sm md:px-24 md:text-base lg:px-32">
        All Rights Reserved. Copyright 2026-27 ICK India Pvt. Ltd.
      </p>
    </footer>
  );
}
