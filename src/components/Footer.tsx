import Image from "next/image";
import { AMAZON_URL, FLIPKART_URL } from "@/lib/buy";

const socials = [
  {
    href: "https://instagram.com",
    src: "/assets/icon-instagram.svg",
    label: "Instagram",
  },
  {
    href: FLIPKART_URL,
    src: "/assets/icon-web.png",
    label: "Buy on Flipkart",
  },
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
        <div className="relative h-20 w-[112px] shrink-0 sm:h-[120px] sm:w-[170px] md:h-[160px] md:w-[220px] lg:h-[213px] lg:w-[298px]">
          <Image
            src="/assets/logo-footer.svg"
            alt="ICK DEATH"
            fill
            className="object-contain object-center md:object-left"
          />
        </div>

        <div className="flex flex-col items-center gap-4 text-center font-[family-name:var(--font-inter)] text-base font-semibold text-white sm:gap-6 sm:text-lg md:flex-row md:gap-12 lg:gap-[150px] lg:text-[22px]">
          <a href="#" className="transition-colors hover:text-neon">
            Terms & Privacy
          </a>
          <a
            href="mailto:hello@ickdeath.com"
            className="transition-colors hover:text-neon"
          >
            Contact Us
          </a>
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
              <Image
                src={social.src}
                alt=""
                fill
                className="object-contain"
              />
            </a>
          ))}
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center gap-4 px-4 pb-8 sm:gap-5 md:block md:px-0">
        <p className="text-center font-[family-name:var(--font-inter)] text-xs leading-relaxed text-text-dim sm:text-sm md:px-24 md:text-xl lg:px-32">
          All Right Reserved. Copyright 2026 Saorsa Technocrat Pvt. Ltd
        </p>

        <div className="relative size-12 shrink-0 overflow-hidden sm:size-14 md:absolute md:bottom-8 md:right-10 md:size-24 lg:bottom-10 lg:right-12 lg:size-32">
          <Image
            src="/assets/skull-footer.svg"
            alt=""
            fill
            className="object-contain"
          />
        </div>
      </div>
    </footer>
  );
}
