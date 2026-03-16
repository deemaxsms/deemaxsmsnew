import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";

const ApiDocs = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container px-4 py-12 md:py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">No Public API</h1>
          <p className="text-lg text-muted-foreground mb-6">
            SMSGlobe does not offer a public API for customers. All products are available
            via the user dashboard (buy numbers, eSIMs, gifts, and top ups). If you need
            a custom integration, please contact our support team.
          </p>
          <div className="flex justify-center gap-4">
            <Button asChild>
              <a href="/contact">Contact Support</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/dashboard">Open Dashboard</a>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ApiDocs;
