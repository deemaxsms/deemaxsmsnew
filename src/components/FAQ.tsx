import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const FAQ = () => {
  const faqs = [
    {
      question: "What is a virtual phone number?",
      answer:
        "A virtual phone number is a temporary phone number that can receive SMS messages without needing a physical SIM card. It's perfect for online verifications while keeping your real number private.",
    },
    {
      question: "How quickly will I receive the SMS?",
      answer:
        "In most cases, SMS messages arrive within seconds. Our system displays incoming messages in real-time on your dashboard.",
    },
    {
      question: "Can I use the same number multiple times?",
      answer:
        "Each activation is for a single use. After receiving your SMS, the number is released. For multiple verifications, you'll need to purchase new activations.",
    },
    {
      question: "Which services are supported?",
      answer:
        "We support hundreds of services including WhatsApp, Telegram, Google, Facebook, Twitter, Instagram, and many more. Check our full list in the dashboard.",
    },
    {
      question: "Is it legal to use virtual numbers?",
      answer:
        "Yes, using virtual numbers for SMS verification is completely legal. However, ensure you comply with the terms of service of the platforms you're verifying on.",
    },
    {
      question: "What if I don't receive an SMS?",
      answer:
        "If you don't receive an SMS within the timeout period, you can request a refund or try another number. Our system automatically handles failed activations.",
    },
  ];

  return (
    <section className="py-20 md:py-32 bg-muted/30">
      <div className="container">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-muted-foreground">
              Everything you need to know about SMSGlobe
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border border-border rounded-xl bg-card px-6 shadow-sm"
              >
                <AccordionTrigger className="text-left font-semibold hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};
