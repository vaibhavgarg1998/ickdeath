import { AssetImage } from "@/components/AssetImage";

const steps = [
  {
    title: "CLEAN",
    description: "Wipe the lid with the alcohol",
    image: "/assets/how-clean.jpg",
  },
  {
    title: "PEEL",
    description: "Peel the 3M adhesive backing.",
    image: "/assets/how-peel.jpg",
  },
  {
    title: "STICK",
    description: "Stick the tab on the seat edge.",
    image: "/assets/how-stick.jpg",
  },
  {
    title: "LIFT",
    description: "Use the tab, not the seat.",
    image: "/assets/how-lift.jpg",
  },
];

export function HowToUse() {
  return (
    <section
      id="how-to-use"
      className="mx-auto w-full max-w-[1728px] border-t border-white/20 px-4 py-12 sm:px-6 sm:py-16 md:px-10 md:py-24 lg:px-16"
    >
      <h2 className="font-[family-name:var(--font-bebas)] text-[clamp(2.25rem,9vw,7.5rem)] leading-[1.1] text-neon-glow sm:leading-[1.193]">
        <span className="text-white">MEET THE </span>
        <span className="text-neon">&ldquo;SEAT SAFE TABS&rdquo;</span>
      </h2>
      <p className="mt-4 max-w-5xl font-[family-name:var(--font-ibm-plex)] text-base font-bold leading-relaxed text-white sm:mt-6 sm:text-xl sm:leading-[1.193] md:text-3xl lg:text-[40px]">
        A tiny tab you stick on the toilet seat edge so you can lift it without
        touching the seat directly.
      </p>

      <h3 className="mt-10 text-center font-[family-name:var(--font-bebas)] text-[clamp(2rem,8vw,6rem)] text-white sm:mt-12 md:mt-16">
        How to use it
      </h3>

      <div className="relative mx-auto mt-6 max-w-[1601px] sm:mt-8 md:mt-12">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-neon/10"
        />
        <div className="relative grid grid-cols-1 gap-3 p-2 sm:gap-4 sm:p-3 md:grid-cols-2 md:gap-5 md:p-6">
          {steps.map((step) => (
            <article
              key={step.title}
              className="border border-border-soft bg-black p-4 sm:p-5 md:p-8"
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden sm:aspect-[576/314]">
                <AssetImage
                  src={step.image}
                  alt={step.description}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <h4 className="mt-4 font-[family-name:var(--font-anton)] text-[clamp(2.25rem,10vw,5.2rem)] capitalize leading-none text-neon sm:mt-6">
                {step.title}
              </h4>
              <p className="mt-2 font-[family-name:var(--font-space-mono)] text-sm capitalize leading-snug text-white sm:mt-3 sm:text-lg md:text-[32px] md:leading-[1.193]">
                {step.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
