import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const About = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container px-4 py-12 md:py-20">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-8">About SMSGlobe</h1>
          
          <div className="prose prose-lg max-w-none space-y-6 text-muted-foreground">
            <p>
              SMSGlobe is a leading provider of virtual phone numbers for SMS verification.
              Founded in 2024, we've quickly become the go-to solution for individuals and
              businesses needing reliable, instant virtual numbers.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">Our Mission</h2>
            <p>
              We believe in making online verification simple, accessible, and private. Our
              platform provides instant access to virtual numbers from 190+ countries,
              helping users verify accounts while protecting their personal information.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">Why Choose Us</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Instant activation - get numbers in seconds</li>
              <li>Global coverage - 190+ countries available</li>
              <li>Reliable delivery - 99.9% SMS success rate</li>
              <li>Secure & private - your data is never shared</li>
              <li>Easy-to-use user dashboard (no public API access)</li>
              <li>24/7 customer support</li>
            </ul>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">Our Values</h2>
            <p>
              Privacy, reliability, and simplicity drive everything we do. We're committed
              to providing the best virtual number service while keeping your information
              secure and your experience seamless.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default About;
