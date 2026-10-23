import { ChooseEdition } from "@/components/ChooseEdition";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { HowToUse } from "@/components/HowToUse";
import { RestaurantSubscription } from "@/components/RestaurantSubscription";
import { WhatsInTheBox } from "@/components/WhatsInTheBox";

export default function Home() {
  return (
    <div
      id="top"
      className="min-h-screen overflow-x-hidden bg-bg pb-[env(safe-area-inset-bottom)]"
    >
      <Header />
      <main className="pb-8 sm:pb-12">
        <Hero />
        <ChooseEdition />
        <HowToUse />
        <WhatsInTheBox />
        <RestaurantSubscription />
      </main>
      <Footer />
    </div>
  );
}
