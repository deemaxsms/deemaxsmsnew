import { Phone, Calendar, Mic, MessageSquareMore } from "lucide-react";
import { cn } from "@/lib/utils";

interface Feature {
  id: string;
  name: string;
  icon: any;
  description: string;
  available: boolean;
}

interface FeatureSelectorProps {
  selectedFeature: string;
  onFeatureChange: (feature: string) => void;
  children: React.ReactNode;
}

export const FeatureSelector = ({ selectedFeature, onFeatureChange, children }: FeatureSelectorProps) => {
  const features: Feature[] = [
    {
      id: "activation",
      name: "SMS Activation",
      icon: Phone,
      description: "Get number for 20 minutes",
      available: true,
    },
    {
      id: "rental",
      name: "Number Rental",
      icon: Calendar,
      description: "Rent for days or weeks",
      available: true,
    },
    {
      id: "voice",
      name: "Voice Calls",
      icon: Mic,
      description: "Receive voice verification",
      available: true,
    },
    {
      id: "multi-sms",
      name: "Multi-SMS",
      icon: MessageSquareMore,
      description: "Multiple SMS to one number",
      available: true,
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h3 className="text-base sm:text-lg font-semibold mb-2">Select Service Type</h3>
        <p className="text-xs sm:text-sm text-muted-foreground">Choose how you want to receive verification</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {features.map((feature) => (
          <button
            key={feature.id}
            onClick={() => feature.available && onFeatureChange(feature.id)}
            disabled={!feature.available}
            className={cn(
              "relative p-4 sm:p-6 rounded-xl border-2 transition-all duration-200",
              "hover:shadow-lg hover:-translate-y-1",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none",
              selectedFeature === feature.id
                ? "border-primary bg-primary/5 shadow-md"
                : "border-border bg-card hover:border-primary/50"
            )}
          >
            <div className="flex flex-col items-center text-center space-y-2 sm:space-y-3">
              <div className={cn(
                "p-2 sm:p-3 rounded-lg",
                selectedFeature === feature.id 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted text-muted-foreground"
              )}>
                <feature.icon className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <p className="font-semibold text-xs sm:text-sm mb-1">{feature.name}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">{feature.description}</p>
              </div>
            </div>
            {selectedFeature === feature.id && (
              <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary animate-pulse" />
            )}
          </button>
        ))}
      </div>

      <div className="mt-6 sm:mt-8">
        {children}
      </div>
    </div>
  );
};
