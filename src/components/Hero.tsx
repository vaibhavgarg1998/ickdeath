import { AssetImage } from "@/components/AssetImage";
import { BuyNowButton } from "@/components/BuyNowButton";

const heroBoxes = [
  {
    src: "/assets/hero-box-1.png",
    alt: "ICK DEATH Traveller edition box",
    className: "absolute left-[2%] top-[3%] z-[1] h-[94%] w-[28.5%]",
  },
  {
    src: "/assets/hero-box-2.png",
    alt: "ICK DEATH Peace edition box",
    className: "absolute left-[24.5%] top-[3%] z-[2] h-[94%] w-[28.5%]",
  },
  {
    src: "/assets/hero-box-3.png",
    alt: "ICK DEATH Beard edition box",
    className: "absolute left-[47%] top-[3%] z-[3] h-[94%] w-[28.5%]",
  },
  {
    src: "/assets/hero-box-4.png",
    alt: "ICK DEATH Barbie edition box",
    className: "absolute left-[69.5%] top-[3%] z-[4] h-[94%] w-[28.5%]",
  },
];

export function Hero() {
  return (
    <section
      id="product"
      className="mx-auto w-full max-w-[1728px] px-4 pb-10 sm:px-6 sm:pb-14 md:px-10 md:pb-16 lg:px-16 lg:pb-20"
    >
      <h1 className="animate-rise mt-5 font-[family-name:var(--font-bebas)] text-[clamp(2.5rem,9vw,7.5rem)] leading-[0.95] sm:mt-7 md:mt-10">
        <span className="block text-white">RESIGN from touching</span>
        <span className="block text-neon">toilet seat directly</span>
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

        <div className="relative mx-auto aspect-[1576/971] w-full max-w-[1576px]">
          <div className="animate-glow-pulse pointer-events-none absolute left-[22.5%] top-[3.4%] z-0 h-[88%] w-[54.4%]">
            <AssetImage
              src="/assets/glow-ellipse.svg"
              alt=""
              fill
              className="object-contain"
            />
          </div>

          <p className="pointer-events-none absolute left-[7%] top-[8%] z-10 max-w-[42%] font-[family-name:var(--font-bebas)] text-[clamp(1.75rem,4.2vw,4.75rem)] leading-none tracking-wide text-white">
            Different Editions
          </p>

          {heroBoxes.map((box) => (
            <div key={box.src} className={box.className}>
              <AssetImage
                src={box.src}
                alt={box.alt}
                fill
                className="object-contain"
                priority
                sizes="(max-width: 768px) 45vw, 30vw"
              />
            </div>
          ))}
        </div>
      </div>

      <BuyNowButton
        trackId="hero_buy_now"
        className="mt-6 inline-flex h-12 w-full items-center justify-center bg-neon px-6 font-[family-name:var(--font-anton)] text-lg uppercase tracking-[0.08em] text-bg transition-opacity hover:opacity-90 sm:mt-8 sm:h-14 sm:w-auto sm:px-8 sm:text-xl md:mt-10 md:h-[72px] md:min-w-[280px] md:text-[32px]"
      >
        Buy Now
      </BuyNowButton>
    </section>
  );
}
