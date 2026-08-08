import { BuyNowProvider } from "@/components/BuyNowProvider";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { HowToUse } from "@/components/HowToUse";
import { WhatsInTheBox } from "@/components/WhatsInTheBox";

export default function Home() {
  return (
    <BuyNowProvider>
      <div
        id="top"
        className="min-h-screen overflow-x-hidden bg-bg pb-[env(safe-area-inset-bottom)]"
      >
        <Header />
        <main className="pb-8 sm:pb-12">
          <Hero />
          <HowToUse />
          <WhatsInTheBox />
        </main>
        <Footer />
      </div>
    </BuyNowProvider>
  );
}
