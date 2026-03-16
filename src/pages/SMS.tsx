/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { smsApi, SMSService } from "@/api/sms-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Smartphone, Globe, Zap, Shield, Star, Clock, CheckCircle, Phone, AlertCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Display service interface for UI
interface DisplayService {
  id: string;
  name: string;
  description: string;
  category: string;
  type: string;
  features: string[];
  pricing: {
    oneTime?: number;
    longTerm?: {
      '3days': number;
      '30days': number;
    };
  };
  available: number;
  icon: any;
  popular: boolean;
}

const SMS = () => {
  const [services, setServices] = useState<DisplayService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Cache key for localStorage
  const CACHE_KEY = 'sms_services_cache';
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  const loadServices = useCallback(async (useCache = true) => {
    try {
      setLoading(true);
      setError(null);

      // Check cache first
      if (useCache) {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          const age = Date.now() - timestamp;
          if (age < CACHE_DURATION) {
            setServices(data);
            setLastUpdated(new Date(timestamp));
            setLoading(false);
            return;
          }
        }
      }

      // Fetch from API
      const apiServices = await smsApi.getServices();

      // Transform to display format
      const displayServices: DisplayService[] = [
        {
          id: 'verification-numbers',
          name: 'SMS Verification Numbers',
          description: 'Temporary phone numbers for SMS verification services',
          category: 'sms',
          type: 'one-time',
          features: ['Instant activation', 'Multiple countries', 'SMS forwarding', 'Auto-detection'],
          pricing: { oneTime: apiServices.find(s => s.name === 'Google')?.markupPrice || 0.75 },
          available: apiServices.reduce((sum, s) => sum + s.available, 0),
          icon: Smartphone,
          popular: true
        },
        {
          id: 'long-term-rentals',
          name: 'Long-term SMS Numbers',
          description: 'Rent phone numbers for extended periods with ongoing SMS support',
          category: 'sms',
          type: 'long-term',
          features: ['30-day rentals', 'Auto-renewal', 'SMS reading', 'Reply capability'],
          pricing: {
            longTerm: {
              '3days': apiServices.find(s => s.name === 'Amazon')?.ltrShortMarkupPrice || 7.50,
              '30days': apiServices.find(s => s.name === 'Amazon')?.ltrMarkupPrice || 30.00
            }
          },
          available: apiServices.reduce((sum, s) => sum + (s.ltrAvailable || 0), 0),
          icon: Phone,
          popular: false
        }
      ];

      setServices(displayServices);
      setLastUpdated(new Date());

      // Cache the results
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data: displayServices,
        timestamp: Date.now()
      }));

    } catch (err: any) {
      console.error('Error loading SMS services:', err);
      setError(err.message || 'Failed to load SMS services');

      // Fallback to cached data if available
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        setServices(data);
        setLastUpdated(new Date(timestamp));
        setError('Using cached data - ' + (err.message || 'Failed to load latest services'));
      }
    } finally {
      setLoading(false);
    }
  }, [CACHE_DURATION]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white">
          <div className="container px-4 py-16 md:py-24">
            <div className="max-w-4xl mx-auto text-center">
              <div className="flex items-center justify-center gap-3 mb-6">
                <MessageSquare className="h-12 w-12" />
                <h1 className="text-4xl md:text-5xl font-bold">SMS Number Rentals</h1>
              </div>
              <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-2xl mx-auto">
                Get temporary and long-term phone numbers for SMS verification and communication
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary" asChild className="shadow-lg">
                  <Link to="/dashboard?tab=services">
                    <Smartphone className="h-5 w-5 mr-2" />
                    Get SMS Number
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  <Shield className="h-5 w-5 mr-2" />
                  How It Works
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Services Section */}
        <div className="container px-4 py-16">
          <div className="text-center mb-12">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-3xl font-bold">SMS Solutions</h2>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                  Choose from our range of SMS number rental services for verification and communication needs
                </p>
              </div>
              <div className="flex items-center gap-2">
                {lastUpdated && (
                  <span className="text-sm text-muted-foreground">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </span>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadServices(false)}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>

            {error && (
              <Alert className="mb-6 max-w-2xl mx-auto">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardHeader>
                    <Skeleton className="h-12 w-12 rounded-lg mb-4" />
                    <Skeleton className="h-6 w-32 mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service) => {
                const Icon = service.icon || MessageSquare;
                return (
                  <Card key={service.id} className="relative overflow-hidden hover:shadow-xl transition-all duration-300 group border-0 shadow-lg">
                    {service.popular && (
                      <div className="absolute top-4 right-4 z-10">
                        <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0">
                          <Star className="h-3 w-3 mr-1" />
                          Popular
                        </Badge>
                      </div>
                    )}

                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                          <Icon className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">{service.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {service.type?.toUpperCase() || 'SMS'}
                            </Badge>
                            {service.available > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {service.available} available
                              </Badge>
                            )}
                            {service.pricing?.oneTime && (
                              <Badge variant="secondary" className="text-xs">
                                From ${service.pricing.oneTime}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <CardDescription className="text-base">
                        {service.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                          Features
                        </h4>
                        <ul className="space-y-1">
                          {service.features?.map((feature: string, index: number) => (
                            <li key={index} className="flex items-center gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                              {feature}
                            </li>
                          )) || (
                            <li className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Shield className="h-4 w-4" />
                              Coming soon
                            </li>
                          )}
                        </ul>
                      </div>

                      {service.pricing && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                            Pricing
                          </h4>
                          <div className="space-y-1">
                            {service.pricing.oneTime && (
                              <div className="flex justify-between text-sm">
                                <span>One-time use:</span>
                                <span className="font-bold">${service.pricing.oneTime}</span>
                              </div>
                            )}
                            {service.pricing.longTerm && (
                              <div className="space-y-1">
                                {service.pricing.longTerm['3days'] && (
                                  <div className="flex justify-between text-sm">
                                    <span>3 days:</span>
                                    <span className="font-bold">${service.pricing.longTerm['3days']}</span>
                                  </div>
                                )}
                                {service.pricing.longTerm['30days'] && (
                                  <div className="flex justify-between text-sm">
                                    <span>30 days:</span>
                                    <span className="font-bold">${service.pricing.longTerm['30days']}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>

                    <CardFooter className="pt-6">
                      <Button
                        className="w-full group-hover:shadow-lg transition-shadow"
                        asChild
                      >
                        <Link to={service.id === 'verification-numbers' || service.id === 'long-term-rentals' ? '/dashboard?tab=services' : '#'}>
                          {service.id === 'verification-numbers' ? (
                            <>
                              <Smartphone className="h-4 w-4 mr-2" />
                              Get Number Now
                            </>
                          ) : service.id === 'long-term-rentals' ? (
                            <>
                              <Clock className="h-4 w-4 mr-2" />
                              Rent Long-term
                            </>
                          ) : (
                            <>
                              <Globe className="h-4 w-4 mr-2" />
                              Learn More
                            </>
                          )}
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* How It Works Section */}
        <div className="bg-muted/30 border-t">
          <div className="container px-4 py-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">How SMS Rentals Work</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Simple process to get SMS numbers for your verification needs
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">1</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Choose Service</h3>
                <p className="text-muted-foreground">
                  Select the verification service you need (Google, Amazon, etc.) and get an available number
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">2</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Use Number</h3>
                <p className="text-muted-foreground">
                  Use the rented number for your verification process. SMS messages are forwarded automatically
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">3</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Receive SMS</h3>
                <p className="text-muted-foreground">
                  View received SMS messages in your dashboard with automatic PIN code extraction
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 border-t">
          <div className="container px-4 py-16">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
              <p className="text-muted-foreground text-lg mb-8">
                Join thousands of users who trust our SMS rental services for their verification and communication needs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild className="shadow-lg">
                  <Link to="/signup">
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Create Account
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/pricing">
                    <Shield className="h-5 w-5 mr-2" />
                    View Pricing
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SMS;