import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { TrustedBy } from "@/components/TrustedBy";
import { PricingPreview } from "@/components/PricingPreview";
import { FAQ } from "@/components/FAQ";
import { Footer } from "@/components/Footer";
import ProductList from '@/components/ProductList';

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <ProductList />
        <TrustedBy />
        <HowItWorks />
        <PricingPreview />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
