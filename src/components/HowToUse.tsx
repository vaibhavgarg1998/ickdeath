import { AssetImage } from "@/components/AssetImage";

const steps = [
  {
    title: "CLEAN",
    description: "Wipe The Lid With The Alcohol",
    image: "/assets/how-to/clean.png",
  },
  {
    title: "PEEL",
    description: "Peel The 3M Adhesive Backing.",
    image: "/assets/how-to/peel.png",
  },
  {
    title: "STICK",
    description: "Stick The Tab On The Seat Edge.",
    image: "/assets/how-to/stick.png",
  },
  {
    title: "LIFT",
    description: "Use The Tab, Not The Seat.",
    image: "/assets/how-to/lift.png",
  },
];

export function HowToUse() {
  return (
    <section
      id="how-to-use"
      className="mx-auto w-full max-w-[1728px] border-t border-white/20 px-4 py-12 sm:px-6 sm:py-16 md:px-10 md:py-24 lg:px-16"
    >
      <h2 className="font-[family-name:var(--font-bebas)] text-[clamp(2rem,7vw,5.5rem)] leading-[1.05]">
        <span className="text-white">JOIN THE </span>
        <span className="text-neon">&ldquo;NO TOUCH MOVEMENT&rdquo;</span>
      </h2>
      <p className="mt-4 max-w-5xl font-[family-name:var(--font-ibm-plex)] text-base font-bold leading-relaxed text-white sm:mt-6 sm:text-lg sm:leading-snug md:text-2xl lg:text-3xl">
        A tiny tab you stick on the toilet seat edge so you can lift it without
        touching the seat directly.
      </p>

      <h3 className="mt-10 text-center font-[family-name:var(--font-bebas)] text-[clamp(1.75rem,6vw,4rem)] text-white sm:mt-12 md:mt-16">
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
              className="flex flex-col bg-black p-4 sm:p-5 md:p-8"
            >
              <h4 className="font-[family-name:var(--font-anton)] text-[clamp(1.75rem,5vw,3.25rem)] leading-none text-neon">
                {step.title}
              </h4>
              <p className="mt-2 font-[family-name:var(--font-space-mono)] text-sm leading-snug text-white sm:mt-3 sm:text-base md:text-xl md:leading-snug">
                {step.description}
              </p>
              <div className="relative mt-4 aspect-[8/3] w-full overflow-hidden sm:mt-6">
                <AssetImage
                  src={step.image}
                  alt={step.description}
                  fill
                  className="object-contain object-left"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
