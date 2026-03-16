import { Button } from "@/components/ui/button";
import { ArrowRight, Globe, Shield, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

export const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background to-muted/30 py-16 sm:py-20 md:py-32">
      {/* Decorative background */}
      <div className="absolute inset-0 bg-grid-slate-200/50 [mask-image:linear-gradient(0deg,white,transparent)] dark:bg-grid-slate-700/25" />
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 blur-3xl" />
      
      <div className="container relative px-4">
        <div className="mx-auto max-w-4xl text-center">
          {/* Logo */}
          <div className="mb-6 sm:mb-8 flex justify-center">
            <img src={logo} alt="SMSGlobe" className="h-20 sm:h-24 md:h-32 drop-shadow-2xl" />
          </div>

          {/* Badge */}
          <div className="mb-6 sm:mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 sm:px-4 py-1.5 text-xs sm:text-sm shadow-sm">
            <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <span className="font-medium">eSIM • Gift • Proxy • RDP • SMS Numbers</span>
          </div>

          {/* Main heading (clean sans, moderate scale) */}
          <h1 className="mb-3 text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight px-4">
            Buy SMS Numbers & eSIMs
          </h1>

          <h2 className="mb-4 text-xl sm:text-2xl text-primary font-semibold px-4">Instant — Private — Global</h2>

          <p className="mb-8 sm:mb-10 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
            Purchase virtual phone numbers, eSIMs and digital gifts with immediate activation. We operate a manual fulfilment model — place an order and our admin will prepare and deliver your details in the dashboard.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-12 sm:mb-16 px-4">
            <Button size="lg" className="text-sm sm:text-base shadow-xl hover:shadow-2xl transition-all w-full sm:w-auto" asChild>
              <Link to="/dashboard">
                Buy Number
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-sm sm:text-base w-full sm:w-auto" asChild>
              <Link to="/top-up">Top Up</Link>
            </Button>
          </div>

          {/* Feature cards */}
          <div className="grid gap-4 sm:gap-6 md:grid-cols-3 mt-16 sm:mt-20">
            <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-3 sm:mb-4 inline-flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-primary/10">
                <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-base sm:text-lg font-semibold">Instant Activation</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Get your number in seconds. No waiting, no delays.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-3 sm:mb-4 inline-flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-secondary/10">
                <Globe className="h-5 w-5 sm:h-6 sm:w-6 text-secondary" />
              </div>
              <h3 className="mb-2 text-base sm:text-lg font-semibold">Global Coverage</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Access numbers from 190+ countries worldwide.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-3 sm:mb-4 inline-flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-success/10">
                <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-success" />
              </div>
              <h3 className="mb-2 text-base sm:text-lg font-semibold">Private & Secure</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Your data is encrypted and never shared with third parties.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
