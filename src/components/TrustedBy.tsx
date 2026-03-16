import { MessageCircle, Send, Mail, Phone, Lock, Users } from "lucide-react";

export const TrustedBy = () => {
  const services = [
    { icon: MessageCircle, name: "WhatsApp" },
    { icon: Send, name: "Telegram" },
    { icon: Mail, name: "Google" },
    { icon: Phone, name: "Signal" },
    { icon: Lock, name: "Discord" },
    { icon: Users, name: "Facebook" },
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="container">
        <div className="text-center mb-12">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
            Trusted for verification
          </p>
          <h2 className="text-2xl font-bold">Works with all major services</h2>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-6 gap-8 max-w-4xl mx-auto">
          {services.map((service, index) => (
            <div
              key={index}
              className="flex flex-col items-center gap-3 opacity-60 hover:opacity-100 transition-opacity"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-background shadow-sm">
                <service.icon className="h-8 w-8 text-foreground" />
              </div>
              <span className="text-sm font-medium text-center">{service.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
