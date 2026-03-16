import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

const Pricing = () => {
  const tiers = [
    {
      name: "Pay As You Go",
      price: "From $0.10",
      description: "Perfect for occasional use",
      features: [
        "190+ countries available",
        "Instant activation",
        "Support for 500+ services",
        "Real-time SMS delivery",
        "No monthly commitment",
        "Pay only for what you use",
      ],
      cta: "Get Started",
      popular: false,
    },
    {
      name: "Pro",
      price: "$49",
      period: "/month",
      description: "For regular users and developers",
      features: [
        "Everything in Pay As You Go",
        "10% discount on all numbers",
          "Priority support",
        "Bulk purchase discounts",
        "Advanced analytics",
        "Webhook notifications",
      ],
      cta: "Start Free Trial",
      popular: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "For large teams and agencies",
      features: [
        "Everything in Pro",
        "Custom volume pricing",
        "Dedicated account manager",
        "99.9% SLA guarantee",
        "Custom integrations",
        "Priority phone support",
        "Quarterly business reviews",
        "Custom contracts",
      ],
      cta: "Contact Sales",
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="py-16 sm:py-20 md:py-32">
          <div className="container px-4">
            <div className="text-center mb-12 sm:mb-16">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl mb-4 px-4">
                Simple, Transparent Pricing
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
                Start for free. Scale as you grow. No hidden fees or surprises.
              </p>
            </div>

            <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
              {tiers.map((tier, index) => (
                <div
                  key={index}
                  className={`relative rounded-2xl border p-6 sm:p-8 shadow-sm hover:shadow-lg transition-all ${
                    tier.popular
                      ? "border-primary bg-card shadow-[0_0_40px_-10px_hsl(var(--primary)/0.3)] lg:scale-105"
                      : "border-border bg-card"
                  }`}
                >
                  {tier.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-primary to-secondary px-3 sm:px-4 py-1 text-xs sm:text-sm font-medium text-white shadow-lg">
                      Most Popular
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="text-lg sm:text-xl font-semibold mb-2">{tier.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-bold">{tier.price}</span>
                      {tier.period && (
                        <span className="text-sm sm:text-base text-muted-foreground">{tier.period}</span>
                      )}
                    </div>
                    <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
                      {tier.description}
                    </p>
                  </div>

                  <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                    {tier.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-2 sm:gap-3">
                        <div className="mt-0.5 flex h-4 w-4 sm:h-5 sm:w-5 shrink-0 items-center justify-center rounded-full bg-success/10">
                          <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-success" />
                        </div>
                        <span className="text-xs sm:text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full"
                    variant={tier.popular ? "default" : "outline"}
                    size="lg"
                    asChild
                  >
                    <Link to="/signup">{tier.cta}</Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Pricing;
