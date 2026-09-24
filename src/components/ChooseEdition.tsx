import { AssetImage } from "@/components/AssetImage";
import { BuyNowButton } from "@/components/BuyNowButton";

const editions = [
  {
    id: "barbie",
    name: "BARBIE",
    src: "/assets/editions/barbie-coffin.png",
    width: 595,
    height: 1024,
  },
  {
    id: "traveller",
    name: "TRAVELLER",
    src: "/assets/editions/traveller-coffin.png",
    width: 595,
    height: 1024,
  },
  {
    id: "beard",
    name: "BEARD",
    src: "/assets/editions/beard-coffin.png",
    width: 585,
    height: 1024,
  },
  {
    id: "peace",
    name: "PEACE",
    src: "/assets/editions/peace-coffin.png",
    width: 595,
    height: 1024,
  },
] as const;

export function ChooseEdition() {
  return (
    <section
      id="editions"
      className="mx-auto w-full max-w-[1728px] border-t border-white/20 px-4 py-12 sm:px-6 sm:py-16 md:px-10 md:py-24 lg:px-16"
    >
      <h2 className="font-[family-name:var(--font-bebas)] text-[clamp(2rem,8vw,7.5rem)] leading-[1.1] text-neon-glow sm:leading-[1.193]">
        <span className="text-white">CHOOSE YOUR </span>
        <span className="text-neon">&ldquo;EDITION&rdquo;</span>
      </h2>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-10 sm:gap-5 md:mt-14 md:gap-8 lg:gap-10">
        {editions.map((edition) => (
          <BuyNowButton
            key={edition.id}
            edition={edition.id}
            className="flex flex-col items-center rounded-2xl bg-[#1c1c1c] px-3 pb-5 pt-6 transition-opacity hover:opacity-90 sm:px-6 sm:pb-8 sm:pt-10 md:rounded-[20px] md:px-10 md:pb-10 md:pt-12"
          >
            <AssetImage
              src={edition.src}
              alt={`${edition.name} edition`}
              width={edition.width}
              height={edition.height}
              className="h-auto w-[78%] mix-blend-lighten"
              sizes="(max-width: 640px) 42vw, (max-width: 1024px) 30vw, 360px"
            />
            <p className="mt-3 text-center font-[family-name:var(--font-bebas)] text-[clamp(1.5rem,4.5vw,5rem)] leading-[1.193] text-neon-glow text-white sm:mt-5 md:mt-6">
              {edition.name}
            </p>
          </BuyNowButton>
        ))}
      </div>
    </section>
  );
}
