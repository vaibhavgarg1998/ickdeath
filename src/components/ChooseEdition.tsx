import { AssetImage } from "@/components/AssetImage";
import { BuyNowButton } from "@/components/BuyNowButton";
import type { TrackedButtonId } from "@/lib/analytics";
import { COLORWAYS, type ColorwayId } from "@/lib/product";

const editionLabels: Record<ColorwayId, string> = {
  barbie: "BARBIE",
  traveller: "TRAVEL",
  beard: "BEARD",
  peace: "PEACE",
};

const editionTrackIds: Record<ColorwayId, TrackedButtonId> = {
  barbie: "edition_barbie",
  traveller: "edition_traveller",
  beard: "edition_beard",
  peace: "edition_peace",
};

export function ChooseEdition() {
  return (
    <section
      id="editions"
      className="mx-auto w-full max-w-[1728px] border-t border-white/20 px-4 py-12 sm:px-6 sm:py-16 md:px-10 md:py-24 lg:px-16"
    >
      <h2 className="font-[family-name:var(--font-bebas)] text-[clamp(2rem,7vw,5.5rem)] leading-[1.05]">
        <span className="text-white">CHOOSE YOUR </span>
        <span className="text-neon">&ldquo;EDITION&rdquo;</span>
      </h2>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-10 sm:gap-5 md:mt-14 md:gap-8 lg:gap-10">
        {COLORWAYS.map((edition) => (
          <BuyNowButton
            key={edition.id}
            edition={edition.id}
            trackId={editionTrackIds[edition.id]}
            className="flex flex-col items-center rounded-2xl bg-[#1c1c1c] px-3 pb-5 pt-5 transition-opacity hover:opacity-90 sm:px-6 sm:pb-8 sm:pt-8 md:rounded-[20px] md:px-10 md:pb-10 md:pt-10"
          >
            <p className="text-center font-[family-name:var(--font-bebas)] text-[clamp(1.35rem,3.5vw,2.75rem)] leading-none text-white">
              {editionLabels[edition.id]}
            </p>
            <div className="relative mt-3 aspect-square w-1/2 overflow-hidden border border-neon sm:mt-5 md:mt-6">
              <AssetImage
                src={edition.productSrc}
                alt={`${editionLabels[edition.id]} edition`}
                fill
                className="object-cover object-center"
                sizes="(max-width: 640px) 21vw, (max-width: 1024px) 15vw, 180px"
              />
            </div>
          </BuyNowButton>
        ))}
      </div>
    </section>
  );
}
