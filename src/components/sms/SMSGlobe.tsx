import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Phone,
  MessageSquare,
  Clock,
  CheckCircle,
  RefreshCw,
  Zap,
  Shield,
  Search,
  Timer,
  Smartphone,
  AlertCircle,
  MapPin,
  Calendar,
} from 'lucide-react';

import { useAuth } from '@/lib/auth-context';
import { tellabotApi, TellabotService } from '@/services/tellabot-api';
import { TellabotActiveNumbers } from './TellabotActiveNumbers';
import { OrderHistory } from './OrderHistory';
import { ServiceIcon } from '@/components/ServiceIcon';

const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
];

interface ActiveRequest {
  id: string;
  mdn: string | '';
  service: string;
  status: 'Awaiting MDN' | 'Reserved' | 'Completed' | 'Rejected' | 'Timed Out';
  till_expiration: number;
  markup: number;
  price: number;
  carrier?: string;
  createdAt: number;
  messages: Array<{
    timestamp: string;
    date_time: string;
    from: string;
    reply: string;
    pin?: string;
  }>;
}

export const SMSGlobe: React.FC = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [services, setServices] = useState<TellabotService[]>([]);
  const [activeRequests, setActiveRequests] = useState<ActiveRequest[]>([]);

  // One-time selection
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [searchService, setSearchService] = useState('');
  const [usePriority, setUsePriority] = useState(false);
  const [customMarkup, setCustomMarkup] = useState<number | ''>('');
  const [state, setState] = useState<string>('');
  const [areaCode, setAreaCode] = useState<string>('');

  // Long-term selection
  const [rentalService, setRentalService] = useState<string>('');
  const [rentalDuration, setRentalDuration] = useState<3 | 30>(30);
  const [rentalState, setRentalState] = useState<string>('');
  const [rentalAreaCode, setRentalAreaCode] = useState<string>('');
  const [autoRenew, setAutoRenew] = useState(false);

  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await tellabotApi.listServices();

        const normalized: TellabotService[] = data.map((s: any) => ({
          name: s.name,
          price: parseFloat(s.price || "0"),
          ltr_price: parseFloat(s.ltr_price || "0"),
          ltr_short_price: s.ltr_short_price ? parseFloat(s.ltr_short_price) : undefined,
          available: parseInt(s.available || "0", 10),
          ltr_available: parseInt(s.ltr_available || "0", 10),
          recommended_markup: s.recommended_markup ? parseInt(s.recommended_markup, 10) : undefined,
        }));

        setServices(normalized);

        // Check provider balance
        try {
          const providerBalance = await tellabotApi.getBalance();
          console.log('💰 Provider balance:', providerBalance);
          if (providerBalance < 1) {
            setError(`⚠️ Service provider account low on balance ($${providerBalance.toFixed(2)}). Service may be unavailable.`);
          }
        } catch (balanceErr) {
          console.warn('Could not check provider balance:', balanceErr);
        }
      } catch (err: any) {
        const msg = err.message || "Unknown error";
        setError(
          msg.includes("Unauthorized")
            ? "API key not activated. Check your email for confirmation."
            : msg
        );
        toast.error("Failed to load services");
      } finally {
        setLoading(false);
      }
    };

    loadServices();

    const interval = setInterval(loadActiveRequests, 10000);
    loadActiveRequests();

    return () => clearInterval(interval);
  }, [user]);

  const loadActiveRequests = async () => {
    if (!user) {
      setActiveRequests([]);
      return;
    }

    try {
      const stored = localStorage.getItem(`tellabot_requests_${user.uid}`);
      if (!stored) {
        setActiveRequests([]);
        return;
      }

      const requests: ActiveRequest[] = JSON.parse(stored);

      const updated = await Promise.all(
        requests.map(async (req) => {
          try {
            const status = await tellabotApi.getRequestStatus(req.id);
            const messages = await tellabotApi.readSMS({ id: req.id });

            return {
              ...req,
              mdn: status.mdn || "",
              status: status.status,
              till_expiration: status.till_expiration,
              markup: status.markup,
              price: status.price,
              carrier: status.carrier,
              messages: messages.map((m) => ({
                timestamp: m.timestamp.toString(),
                date_time: m.date_time,
                from: m.from,
                reply: m.reply,
                pin: m.pin,
              })),
            };
          } catch {
            return req;
          }
        })
      );

      const active = updated.filter((r) => r.status === "Awaiting MDN" || r.status === "Reserved");
      localStorage.setItem(`tellabot_requests_${user.uid}`, JSON.stringify(active));
      setActiveRequests(active);
    } catch (err) {
      console.error("Failed to load active requests");
    }
  };

  const filteredServices = services.filter((s) =>
    s.name.toLowerCase().includes(searchService.toLowerCase())
  );

  // Fixed: handleServiceSelect function added
  const handleServiceSelect = (serviceName: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceName)
        ? prev.filter((n) => n !== serviceName)
        : [...prev, serviceName]
    );
  };

  const oneTimePrice = selectedServices.reduce((sum, name) => {
    const svc = services.find((s) => s.name === name);
    return sum + (svc?.price || 0);
  }, 0);

  const priorityAddon = usePriority && customMarkup ? customMarkup / 100 : 0;
  const oneTimeFinalPrice = oneTimePrice + priorityAddon;

  const handleOneTimeOrder = async () => {
    if (!user || selectedServices.length === 0) {
      toast.error("Select at least one service");
      return;
    }
    if (customMarkup && (customMarkup < 10 || customMarkup > 2000)) {
      toast.error("Markup must be between 10 and 2000");
      return;
    }

    // Check user balance before making purchase
    if (!profile) {
      toast.error("User profile not found. Please refresh and try again.");
      return;
    }

    // Calculate total cost
    const totalCost = selectedServices.reduce((sum, name) => {
      const svc = services.find((s) => s.name === name);
      const basePrice = svc?.price || 0;
      return sum + basePrice;
    }, 0);

    const finalCost = usePriority && customMarkup ? totalCost + (customMarkup / 100) : totalCost;

    console.log('🔍 Balance Check (One-Time):', {
      userBalance: profile.balance,
      estimatedCost: finalCost,
      selectedServices,
      hasEnoughBalance: profile.balance >= finalCost
    });

    // Check balance
    if (profile.balance < finalCost) {
      toast.error(
        `Insufficient balance. Required: $${finalCost.toFixed(2)}, Available: $${profile.balance.toFixed(2)}. Please top up your account.`
      );
      return;
    }

    console.log('✅ Balance check passed, proceeding with order...');

    try {
      setLoading(true);
      const markup = usePriority ? (customMarkup || 0) : undefined;

      const result = await tellabotApi.requestNumber(selectedServices, {
        state: state || undefined,
        areacode: areaCode || undefined,
        markup,
      });

      const newRequests = result.map((r) => ({
        id: r.id,
        mdn: r.mdn,
        service: r.service,
        status: r.status,
        till_expiration: r.till_expiration,
        markup: r.markup,
        price: r.price,
        carrier: r.carrier,
        createdAt: Date.now(),
        messages: [],
      }));

      const stored = localStorage.getItem(`tellabot_requests_${user.uid}`);
      const existing: ActiveRequest[] = stored ? JSON.parse(stored) : [];
      const updated = [...existing.filter((r) => !newRequests.some((nr) => nr.id === r.id)), ...newRequests];
      localStorage.setItem(`tellabot_requests_${user.uid}`, JSON.stringify(updated));

      toast.success(
        result.some((r) => r.status === "Awaiting MDN")
          ? "Priority bids placed — waiting for numbers..."
          : "Numbers received!"
      );

      setSelectedServices([]);
      setUsePriority(false);
      setCustomMarkup("");
      setState("");
      setAreaCode("");
      loadActiveRequests();
    } catch (err: any) {
      const errorMessage = err.message || "Order failed";
      console.error('❌ Order error:', errorMessage);
      
      // Better error messages
      if (errorMessage.toLowerCase().includes('low balance') || errorMessage.toLowerCase().includes('insufficient')) {
        toast.error("Provider account has insufficient balance. Please contact support.");
      } else if (errorMessage.toLowerCase().includes('no numbers available')) {
        toast.error("No SMS numbers are currently available. Please try again in a few minutes.");
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Calculate rental price for display and purchase
  const rentalServiceData = services.find((s) => s.name === rentalService);
  const rentalPrice = rentalDuration === 3
    ? rentalServiceData?.ltr_short_price || 0
    : rentalServiceData?.ltr_price || 0;

  const handleRentalOrder = async () => {
    if (!user || !rentalService) {
      toast.error("Select a service");
      return;
    }

    // Check user balance before making purchase
    if (!profile) {
      toast.error("User profile not found. Please refresh and try again.");
      return;
    }

    // Verify rental service data is available
    if (!rentalServiceData) {
      toast.error("Service data not loaded. Please try again.");
      console.error('❌ Rental service data not found for:', rentalService);
      return;
    }

    // Verify pricing is available
    if (rentalPrice === 0) {
      toast.error("Service pricing not available. Please try again.");
      console.error('❌ Rental price is 0 for service:', rentalService, 'duration:', rentalDuration);
      return;
    }

    console.log('🔍 Balance Check:', {
      userBalance: profile.balance,
      rentalService,
      rentalDuration,
      rentalServiceData,
      rentalPrice,
      hasEnoughBalance: profile.balance >= rentalPrice
    });

    // Check balance
    if (profile.balance < rentalPrice) {
      toast.error(
        `Insufficient balance. Required: $${rentalPrice.toFixed(2)}, Available: $${profile.balance.toFixed(2)}. Please top up your account.`
      );
      return;
    }

    console.log('✅ Balance check passed, proceeding with rental order...');

    try {
      setLoading(true);

      const result = await tellabotApi.rentLongTerm(rentalService, {
        duration: rentalDuration,
        state: rentalState || undefined,
        areacode: rentalAreaCode || undefined,
        autorenew: autoRenew,
      });

      toast.success("Long-term rental created!");
      setRentalService("");
      setRentalDuration(30);
      setAutoRenew(false);
      setRentalState("");
      setRentalAreaCode("");
    } catch (err: any) {
      const errorMessage = err.message || "Rental failed";
      console.error('❌ Rental error:', errorMessage);
      
      // Better error messages
      if (errorMessage.toLowerCase().includes('low balance') || errorMessage.toLowerCase().includes('insufficient')) {
        toast.error("Provider account has insufficient balance. Please contact support.");
      } else if (errorMessage.toLowerCase().includes('no numbers available')) {
        toast.error("No SMS numbers are currently available. Please try again in a few minutes.");
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          SMS Verification Numbers
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Real US phone numbers for account verification
        </p>
      </div>

      {/* Global Error */}
      {error && (
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertCircle className="h-5 w-5" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="one-time" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-8 h-auto">
          <TabsTrigger value="one-time" className="flex-col h-16 lg:h-10 lg:flex-row gap-1 lg:gap-2 text-xs lg:text-sm">
            <Smartphone className="h-4 w-4 lg:h-5 lg:w-5" />
            <span className="hidden sm:inline lg:inline">One-Time</span>
            <span className="sm:hidden">Numbers</span>
          </TabsTrigger>
          <TabsTrigger value="long-term" className="flex-col h-16 lg:h-10 lg:flex-row gap-1 lg:gap-2 text-xs lg:text-sm">
            <Clock className="h-4 w-4 lg:h-5 lg:w-5" />
            <span className="hidden sm:inline lg:inline">Long-Term</span>
            <span className="sm:hidden">Rentals</span>
          </TabsTrigger>
          <TabsTrigger value="active" className="flex-col h-16 lg:h-10 lg:flex-row gap-1 lg:gap-2 text-xs lg:text-sm">
            <MessageSquare className="h-4 w-4 lg:h-5 lg:w-5" />
            <span>Active ({activeRequests.length})</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex-col h-16 lg:h-10 lg:flex-row gap-1 lg:gap-2 text-xs lg:text-sm">
            <Calendar className="h-4 w-4 lg:h-5 lg:w-5" />
            <span>History</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="one-time">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3">
                <Smartphone className="h-8 w-8 text-blue-600" />
                Available Services (One-Time)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Search services..."
                  value={searchService}
                  onChange={(e) => setSearchService(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Geo Targeting */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">State (optional)</label>
                  <Select value={state} onValueChange={setState}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {US_STATES.map((s) => (
                        <SelectItem key={s.code} value={s.code}>
                          {s.name} ({s.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Area Code (optional)</label>
                  <Input
                    placeholder="e.g. 415"
                    value={areaCode}
                    onChange={(e) => setAreaCode(e.target.value.replace(/\D/g, '').slice(0, 3))}
                    maxLength={3}
                  />
                </div>
              </div>

              <ScrollArea className="h-96 border rounded-lg p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {filteredServices.length === 0 ? (
                    <p className="col-span-full text-center text-gray-500 py-8">
                      No services found
                    </p>
                  ) : (
                    filteredServices.map((service) => {
                      const isSelected = selectedServices.includes(service.name);
                      const hasStock = service.available > 0;

                      return (
                        <div
                          key={service.name}
                          className={`border rounded-lg p-4 cursor-pointer transition-all ${
                            isSelected ? "border-primary bg-primary/10 ring-2 ring-primary" : "hover:border-primary"
                          } ${!hasStock ? "opacity-50 cursor-not-allowed" : ""}`}
                          onClick={() => hasStock && handleServiceSelect(service.name)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <ServiceIcon serviceName={service.name} size="lg" />
                            <Checkbox 
                              checked={isSelected} 
                              disabled 
                              className="pointer-events-none" 
                            />
                          </div>
                          <p className="font-medium text-center">{service.name}</p>
                          <div className="text-center mt-2">
                            <Badge variant={hasStock ? "default" : "secondary"}>
                              {service.available} left
                            </Badge>
                          </div>
                          <p className="text-lg font-bold text-green-600 text-center mt-2">
                            ${service.price.toFixed(2)}
                          </p>
                          {service.recommended_markup && service.recommended_markup > 0 && (
                            <p className="text-xs text-gray-500 text-center">
                              +${(service.recommended_markup / 100).toFixed(2)} priority
                            </p>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>

              {selectedServices.length > 0 && (
                <div className="p-6 bg-blue-50 rounded-xl border-2 border-blue-200">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-2xl font-bold">
                        {selectedServices.length === 1 ? selectedServices[0] : `${selectedServices.length} Services`}
                      </h3>
                      <p className="text-gray-600">
                        {selectedServices.length} number{selectedServices.length > 1 ? 's' : ''} will be requested
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-green-600">
                        ${oneTimeFinalPrice.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-600">total</p>
                    </div>
                  </div>

                  {selectedServices.length > 1 && (
                    <Alert className="mb-4">
                      <AlertDescription>
                        Requesting multiple services will get a number that works for all of them (if available)
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Balance Check Section */}
                  <div className="mb-6 p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-transparent">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-700">Your Balance</p>
                        <p className="text-2xl font-bold text-green-600">
                          ${profile?.balance?.toFixed(2) || "0.00"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Cost</p>
                        <p className={`text-2xl font-bold ${
                          profile && profile.balance >= oneTimeFinalPrice ? 'text-green-600' : 'text-red-600'
                        }`}>
                          ${oneTimeFinalPrice.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    {profile && profile.balance < oneTimeFinalPrice && (
                      <Alert variant="destructive" className="mt-4">
                        <AlertCircle className="h-5 w-5" />
                        <AlertDescription>
                          Insufficient balance. Need ${(oneTimeFinalPrice - profile.balance).toFixed(2)} more.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  <div className="mb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Priority Mode (Faster)</p>
                        <p className="text-sm text-gray-600">
                          Bid to jump the queue when stock is low
                        </p>
                      </div>
                      <Button
                        variant={usePriority ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setUsePriority(!usePriority);
                          if (!usePriority) setCustomMarkup("");
                        }}
                      >
                        {usePriority ? "ON" : "OFF"}
                      </Button>
                    </div>

                    {usePriority && (
                      <div className="flex items-center gap-3 mt-4">
                        <Input
                          type="number"
                          placeholder={`Suggested: ${services
                            .find((s) => selectedServices.includes(s.name))
                            ?.recommended_markup || 10}`}
                          value={customMarkup}
                          onChange={(e) => setCustomMarkup(e.target.value ? Number(e.target.value) : "")}
                          min="10"
                          max="2000"
                          step="10"
                          className="w-48"
                        />
                        <span className="text-sm text-gray-600">cents extra</span>
                      </div>
                    )}
                  </div>

                  <Button size="lg" className="w-full text-lg py-6" onClick={handleOneTimeOrder} disabled={loading}>
                    {loading ? (
                      <>
                        <RefreshCw className="h-6 w-6 animate-spin mr-3" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-6 w-6 mr-3" />
                        Get {selectedServices.length > 1 ? "Numbers" : "Number"} Now
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="long-term">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3">
                <Clock className="h-8 w-8 text-purple-600" />
                Long-Term Rentals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1">Service</label>
                  <Select value={rentalService} onValueChange={setRentalService}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select service" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((s) => (
                        <SelectItem key={s.name} value={s.name}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Duration</label>
                  <Select value={rentalDuration.toString()} onValueChange={(v) => setRentalDuration(Number(v) as 3 | 30)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 Days</SelectItem>
                      <SelectItem value="30">30 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1">State (optional)</label>
                  <Select value={rentalState} onValueChange={setRentalState}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {US_STATES.map((s) => (
                        <SelectItem key={s.code} value={s.code}>
                          {s.name} ({s.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Area Code (optional)</label>
                  <Input
                    placeholder="e.g. 415"
                    value={rentalAreaCode}
                    onChange={(e) => setRentalAreaCode(e.target.value.replace(/\D/g, '').slice(0, 3))}
                    maxLength={3}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="autorenew" checked={autoRenew} onCheckedChange={(checked) => setAutoRenew(checked as boolean)} />
                <label htmlFor="autorenew" className="text-sm font-medium cursor-pointer">
                  Auto-renew rental (if balance allows)
                </label>
              </div>

              {rentalService && rentalServiceData && (
                <div className="p-6 bg-purple-50 rounded-xl border-2 border-purple-200">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-2xl font-bold">{rentalService}</h3>
                      <p className="text-gray-600">
                        {rentalServiceData.ltr_available} long-term available
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-green-600">
                        ${rentalPrice.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {rentalDuration === 3 ? "3 days" : "30 days"}
                      </p>
                    </div>
                  </div>

                  {/* Balance Check Section for Rental */}
                  <div className="mb-6 p-4 border rounded-lg bg-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-700">Your Balance</p>
                        <p className="text-2xl font-bold text-green-600">
                          ${profile?.balance?.toFixed(2) || "0.00"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Rental Cost</p>
                        <p className={`text-2xl font-bold ${
                          profile && profile.balance >= rentalPrice ? 'text-green-600' : 'text-red-600'
                        }`}>
                          ${rentalPrice.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    {profile && profile.balance < rentalPrice && (
                      <Alert variant="destructive" className="mt-4">
                        <AlertCircle className="h-5 w-5" />
                        <AlertDescription>
                          Insufficient balance. Need ${(rentalPrice - profile.balance).toFixed(2)} more.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  <Button size="lg" className="w-full text-lg py-6" onClick={handleRentalOrder} disabled={loading}>
                    {loading ? (
                      <>
                        <RefreshCw className="h-6 w-6 animate-spin mr-3" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-6 w-6 mr-3" />
                        Rent Now
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active">
          <TellabotActiveNumbers
            requests={activeRequests}
            onRefresh={loadActiveRequests}
            onReject={async (id) => {
              await tellabotApi.rejectRequest(id);
              loadActiveRequests();
            }}
          />
        </TabsContent>

        <TabsContent value="history">
          <OrderHistory userId={user?.uid} />
        </TabsContent>
      </Tabs>
    </div>
  );
};