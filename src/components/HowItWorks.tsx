import { Search, Smartphone, MessageSquare } from "lucide-react";

export const HowItWorks = () => {
  const steps = [
    {
      icon: Search,
      title: "Choose Service & Country",
      description: "Select the service you need verification for and pick your preferred country.",
    },
    {
      icon: Smartphone,
      title: "Get Number Instantly",
      description: "Receive a virtual phone number immediately. No waiting, no delays.",
    },
    {
      icon: MessageSquare,
      title: "Receive SMS in Dashboard",
      description: "View incoming SMS codes in real-time on your personal dashboard.",
    },
  ];

  return (
    <section className="py-16 sm:py-20 md:py-32">
      <div className="container px-4">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl mb-4">
            How It Works
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
            Get your virtual number in three simple steps
          </p>
        </div>

        <div className="grid gap-6 sm:gap-8 md:grid-cols-3 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Connection line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
              )}
              
              <div className="relative rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm hover:shadow-md transition-all hover:border-primary/50">
                {/* Step number */}
                <div className="absolute -top-4 -left-4 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-sm font-bold text-white shadow-lg">
                  {index + 1}
                </div>

                <div className="mb-4 inline-flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10">
                  <step.icon className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                </div>
                
                <h3 className="mb-3 text-lg sm:text-xl font-semibold">{step.title}</h3>
                <p className="text-sm sm:text-base text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
