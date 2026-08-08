import { AssetImage } from "@/components/AssetImage";

const contents = [
  "1X Ick Death Lifter",
  "1X Alcohol Wipe",
  "1X Alcohol Wipe",
  "1X Gloves",
];

const specs = [
  { id: "01", label: "Strong Adhesive" },
  { id: "02", label: "Fits All Seats" },
  { id: "03", label: "Premium Quality" },
  { id: "04", label: "Water Resistant" },
];

export function WhatsInTheBox() {
  return (
    <section
      id="specs"
      className="mx-auto w-full max-w-[1728px] border-t border-white/20 px-4 py-12 sm:px-6 sm:py-16 md:px-10 md:py-24 lg:px-16"
    >
      <h2 className="font-[family-name:var(--font-bebas)] text-[clamp(2.25rem,9vw,7.5rem)] leading-[1.1] text-neon-glow text-white sm:leading-[1.193]">
        INDIA IS DONE TOUCHING{" "}
        <span className="text-neon">&ldquo;THAT&rdquo;</span>
      </h2>
      <p className="mt-4 max-w-5xl font-[family-name:var(--font-ibm-plex)] text-base leading-relaxed text-white sm:mt-6 sm:text-2xl sm:leading-[1.193] md:text-4xl lg:text-[60px]">
        For people who expect better hygiene. Tiny tools. Less contact. Cleaner
        habits.
      </p>

      <h3 className="mt-10 text-center font-[family-name:var(--font-bebas)] text-[clamp(2rem,8vw,6rem)] text-white sm:mt-12 md:mt-16">
        Whats in the box
      </h3>

      <div className="mt-6 grid gap-3 sm:mt-8 sm:gap-4 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1fr)] lg:items-stretch lg:gap-0">
        <div className="flex flex-col border border-muted">
          <div className="border-b border-muted px-4 py-4 sm:px-6 sm:py-5 md:px-8">
            <p className="font-[family-name:var(--font-space-mono)] text-lg font-bold capitalize text-neon sm:text-2xl md:text-[40px]">
              What&apos;s inside
            </p>
          </div>
          <ul className="flex-1">
            {contents.map((item, index) => (
              <li
                key={`${item}-${index}`}
                className="flex items-start gap-2.5 border-b border-muted px-4 py-4 last:border-b-0 sm:items-center sm:gap-3 sm:px-6 sm:py-5 md:gap-4 md:px-8 md:py-6"
              >
                <span className="shrink-0 font-[family-name:var(--font-anton)] text-2xl capitalize leading-none text-muted sm:text-3xl md:text-[55px]">
                  {index + 1}.
                </span>
                <span className="min-w-0 break-words font-[family-name:var(--font-space-mono)] text-base font-bold capitalize leading-snug text-white sm:text-xl md:text-[36px]">
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="w-full min-w-0 overflow-hidden border border-black bg-black">
          <AssetImage
            src="/assets/box-contents.jpg"
            alt="ICK DEATH kit contents laid out"
            width={1408}
            height={768}
            className="h-auto w-full object-contain"
            sizes="(max-width: 1024px) 100vw, 55vw"
          />
        </div>
      </div>

      <div className="mt-4 bg-bg-elevated p-3 sm:mt-6 sm:p-4 md:mt-8 md:p-6">
        <div className="grid grid-cols-1 gap-2.5 xs:grid-cols-2 sm:gap-3 xl:grid-cols-4">
          {specs.map((spec) => (
            <div
              key={spec.id}
              className="flex min-h-[110px] flex-col justify-center border border-black bg-bg px-4 py-5 sm:min-h-[140px] sm:px-6 sm:py-8 md:min-h-[200px]"
            >
              <p className="font-[family-name:var(--font-anton)] text-xs capitalize text-white sm:text-sm md:text-xl">
                spec {spec.id}
              </p>
              <p className="mt-2 font-[family-name:var(--font-ibm-plex)] text-base font-bold uppercase leading-snug text-white sm:mt-3 sm:text-xl md:text-[28px]">
                {spec.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
