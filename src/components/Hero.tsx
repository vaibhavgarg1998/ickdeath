import { AssetImage } from "@/components/AssetImage";
import { BuyNowButton } from "@/components/BuyNowButton";

const features = [
  {
    label: "NO TOUCH",
    icon: "/assets/icon-no-touch.svg",
    width: 42,
    height: 42,
  },
  {
    label: "HYGIENIC",
    icon: "/assets/icon-hygienic.svg",
    width: 46,
    height: 50,
  },
  {
    label: "PREMIUM",
    icon: "/assets/icon-premium.svg",
    width: 68,
    height: 64,
  },
  {
    label: "REPLACE",
    icon: "/assets/icon-replace.svg",
    width: 56,
    height: 63,
  },
];

export function Hero() {
  return (
    <section
      id="product"
      className="mx-auto w-full max-w-[1728px] px-4 pb-10 sm:px-6 sm:pb-14 md:px-10 md:pb-16 lg:px-16 lg:pb-20"
    >
      <h1 className="animate-rise mt-5 font-[family-name:var(--font-bebas)] text-[clamp(2.75rem,15vw,18.75rem)] leading-[0.92] tracking-tight text-neon-glow sm:mt-7 md:mt-10">
        <span className="block text-white">END THE</span>
        <span className="block text-neon">BARE HAND ERA</span>
      </h1>

      <div className="animate-rise-delay-1 relative mt-5 overflow-hidden bg-bg-stage sm:mt-8 md:mt-12">
        <div className="pointer-events-none absolute left-2 top-2 size-10 sm:left-4 sm:top-4 sm:size-16 md:left-6 md:top-6 md:size-[121px]">
          <AssetImage
            src="/assets/corner-tl.svg"
            alt=""
            fill
            className="object-contain"
          />
        </div>
        <div className="pointer-events-none absolute bottom-2 right-2 size-10 rotate-180 sm:bottom-4 sm:right-4 sm:size-16 md:bottom-6 md:right-6 md:size-[121px]">
          <AssetImage
            src="/assets/corner-br.svg"
            alt=""
            fill
            className="object-contain"
          />
        </div>

        <div className="relative mx-auto flex min-h-[240px] items-center justify-center px-3 py-8 sm:min-h-[320px] sm:px-4 sm:py-12 md:min-h-[560px] md:px-8 md:py-16 lg:min-h-[720px]">
          <div className="animate-glow-pulse pointer-events-none absolute left-1/2 top-1/2 size-[min(110vw,420px)] -translate-x-1/2 -translate-y-1/2 sm:size-[min(95vw,540px)] lg:size-[780px]">
            <AssetImage
              src="/assets/glow-ellipse.svg"
              alt=""
              fill
              className="object-contain"
            />
          </div>

          <div className="relative z-10 flex w-full max-w-6xl items-center justify-center">
            <div className="relative h-[170px] w-[58%] overflow-hidden xs:h-[200px] sm:h-[260px] md:h-[440px] lg:h-[560px]">
              <AssetImage
                src="/assets/product-open.png"
                alt="ICK DEATH open product box with seat safe tab"
                fill
                className="origin-center scale-[2.1] object-cover object-[48%_42%] sm:scale-[2.4]"
                priority
                sizes="(max-width: 640px) 70vw, (max-width: 768px) 60vw, 700px"
              />
            </div>
            <div className="relative -ml-[12%] h-[185px] w-[52%] overflow-hidden sm:-ml-[10%] sm:h-[280px] md:h-[480px] lg:h-[600px]">
              <AssetImage
                src="/assets/product-closed.png"
                alt="ICK DEATH product box"
                fill
                className="origin-center scale-[2] object-cover object-[52%_38%] sm:scale-[2.2]"
                priority
                sizes="(max-width: 640px) 65vw, (max-width: 768px) 55vw, 650px"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 border border-neon bg-bg-elevated px-3 py-4 sm:mt-8 sm:px-5 sm:py-5 md:mt-10 md:px-8 md:py-7">
        <ul className="mx-auto grid max-w-5xl grid-cols-2 gap-x-3 gap-y-4 sm:gap-x-6 sm:gap-y-5 md:flex md:flex-wrap md:items-center md:justify-between lg:gap-x-12">
          {features.map((feature) => (
            <li
              key={feature.label}
              className="flex items-center gap-2 font-[family-name:var(--font-bebas)] text-base tracking-wide text-neon sm:gap-2.5 sm:text-2xl md:text-3xl lg:text-[40px]"
            >
              <span className="relative inline-flex size-7 shrink-0 items-center justify-center overflow-hidden sm:size-10 md:size-14">
                <AssetImage
                  src={feature.icon}
                  alt=""
                  width={feature.width}
                  height={feature.height}
                  className="max-h-full max-w-full object-contain"
                />
              </span>
              {feature.label}
            </li>
          ))}
        </ul>
      </div>

      <p className="animate-rise-delay-2 mt-6 max-w-5xl font-[family-name:var(--font-ibm-plex)] text-base leading-relaxed text-white sm:mt-8 sm:text-xl sm:leading-[1.193] md:mt-12 md:text-3xl lg:text-[40px]">
        Tiny hygiene tabs that help you lift the toilet seat without touching it
        directly. Pick your personality.
      </p>

      <BuyNowButton className="mt-6 inline-flex h-12 w-full items-center justify-center bg-neon px-6 font-[family-name:var(--font-anton)] text-lg uppercase tracking-[0.16em] text-bg transition-opacity hover:opacity-90 sm:mt-8 sm:h-14 sm:w-auto sm:px-8 sm:text-xl md:mt-10 md:h-[90px] md:min-w-[360px] md:text-[40px]">
        Buy Now
      </BuyNowButton>
    </section>
  );
}
