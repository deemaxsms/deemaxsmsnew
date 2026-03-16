import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, Smartphone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getServiceLogo, countryData } from "@/lib/service-data";
import { toast } from "sonner";

interface DynamicServicePickerProps {
  onBuyNumber: (service: string, country: string, price: number, type: string, days?: number) => Promise<void>;
  activationType: string;
}

interface Service {
  code: string;
  name: string;
  icon?: string;
  basePrice?: number;
  ltr_price?: number;
  ltr_short_price?: number;
  available?: number;
  raw?: any;
}

interface Country {
  code: string;
  name: string;
  flag?: string;
  count?: number;
  price?: number;
}

export const DynamicServicePicker = ({ onBuyNumber, activationType }: DynamicServicePickerProps) => {
  const [services, setServices] = useState<Service[]>([]);
  const [service, setService] = useState("");
  const [country, setCountry] = useState("");
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [searchService, setSearchService] = useState("");
  const [searchCountry, setSearchCountry] = useState("");
  const [highlightedService, setHighlightedService] = useState<number>(-1);
  const [highlightedCountry, setHighlightedCountry] = useState<number>(-1);
  const serviceSearchTimer = useRef<number | null>(null);
  const countrySearchTimer = useRef<number | null>(null);
  const [rentalDays, setRentalDays] = useState("7");

  useEffect(() => {
    loadServices();
  }, []);

  useEffect(() => {
    if (service) {
      // load countries and set prices when a service is selected
      loadCountries(service);
      setCountry("");
    }
  }, [service]);

  const loadServices = async () => {
    try {
      // Load services from local JSON file
      const response = await fetch('/json/services.json');
      const data = await response.json();
      
      if (data.status === "ok" && data.message) {
        const allServices = data.message.map((item: any) => ({
          code: item.name,
          name: item.name,
          // prefer explicit icon field, otherwise point to service-icon API which may return provider icon
          icon: item.icon || `/api/service-icon?name=${encodeURIComponent(item.name)}`,
          basePrice: item.price ? parseFloat(item.price) : 0,
          ltr_price: item.ltr_price ? parseFloat(item.ltr_price) : undefined,
          ltr_short_price: item.ltr_short_price ? parseFloat(item.ltr_short_price) : undefined,
          available: item.available ? parseInt(item.available) : 0,
          raw: item
        }));
        setServices(allServices);
      }
    } catch (error) {
      console.error("Error loading services:", error);
      toast.error("Failed to load services");
    }
  };

  const loadCountries = async (serviceCode?: string) => {
    setLoadingCountries(true);
    try {
      // Build countries list from `countryData` mapping for faster, sharper UX
      const items: Country[] = Object.keys(countryData).map((k) => ({
        code: k,
        name: countryData[k].name,
        flag: countryData[k].flag,
        count: 100,
        price: 0
      }));

      // If we have a selected service, set the country price to that service basePrice or per-country override
      if (serviceCode) {
        const s = services.find((x) => x.code === serviceCode);
        if (s && (s as any).raw) {
          const raw = (s as any).raw;
          const base = (s as any).basePrice || 0;
          items.forEach((it) => {
            // raw.countries expected to be an object mapping country codes to price strings
            if (raw.countries && raw.countries[it.code]) {
              it.price = parseFloat(raw.countries[it.code]);
            } else if (raw.countries && raw.countries[it.code.toString()]) {
              it.price = parseFloat(raw.countries[it.code.toString()]);
            } else {
              it.price = base;
            }
          });
        }
      }

      setCountries(items);
    } catch (error) {
      console.error('Error loading countries:', error);
      toast.error('Failed to load countries');
    } finally {
      setLoadingCountries(false);
    }
  };

  const handleBuy = async () => {
    if (!service || !country) {
      toast.error('Please select a service and a country');
      return;
    }
    
    try {
      // Load service pricing from local JSON
      const response = await fetch('/json/services.json');
      const data = await response.json();
      
      const selectedServiceData = data.message.find((item: any) => item.name === service);
      if (!selectedServiceData) {
        toast.error("Service pricing not found");
        return;
      }
      
      // start with API base price
      let basePrice = parseFloat(selectedServiceData.price || 0);

      // If the provider exposes country-specific prices in the JSON, prefer that
      if (selectedServiceData.countries) {
        // try exact code first
        if (selectedServiceData.countries[country]) {
          basePrice = parseFloat(selectedServiceData.countries[country]);
        } else if (selectedServiceData.countries[country.toString()]) {
          basePrice = parseFloat(selectedServiceData.countries[country.toString()]);
        }
      }

      // Adjust base price based on activation type (use ltr prices where applicable)
      if (activationType === "rental") {
        const ltr = parseFloat(selectedServiceData.ltr_price || selectedServiceData.price || 0);
        // prorate by days (approximation)
        basePrice = (ltr * (parseInt(rentalDays) / 30));
        // if there is a country override for ltr, prefer it
        if (selectedServiceData.countries && selectedServiceData.countries[`${country}_ltr`]) {
          basePrice = parseFloat(selectedServiceData.countries[`${country}_ltr`]);
        }
      } else if (activationType === "voice") {
        // voice activations cost 50% more on top of base before markup
        basePrice = basePrice * 1.5;
      }

      // Apply 50% markup (user requested +50% on initial API price)
      const finalPrice = Number((basePrice * 1.5).toFixed(2));
      
      setLoading(true);
      try {
        await onBuyNumber(service, country, finalPrice, activationType, activationType === "rental" ? parseInt(rentalDays) : undefined);
      } finally {
        setLoading(false);
      }
    } catch (error) {
      console.error("Error getting service pricing:", error);
      toast.error("Failed to get pricing information");
    }
  };

  // Debounced-ish filtering (simple) and sharp UX
  const filteredServices = services.filter((s) =>
    s.name.toLowerCase().includes(searchService.toLowerCase())
  ).slice(0, 200); // limit results for performance

  const filteredCountries = countries.filter((c) =>
    c.name.toLowerCase().includes(searchCountry.toLowerCase())
  );

  const selectedService = services.find((s) => s.code === service);
  const selectedCountry = countries.find((c) => c.code.toString() === country);

  // Keyboard handlers for service search
  const handleServiceKeyDown = (e: any) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedService((h) => Math.min(h + 1, filteredServices.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedService((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      if (highlightedService >= 0 && filteredServices[highlightedService]) {
        setService(filteredServices[highlightedService].code);
      }
    } else if (e.key === 'Escape') {
      setHighlightedService(-1);
    }
  };

  // Keyboard handlers for country search
  const handleCountryKeyDown = (e: any) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedCountry((h) => Math.min(h + 1, filteredCountries.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedCountry((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      if (highlightedCountry >= 0 && filteredCountries[highlightedCountry]) {
        setCountry(filteredCountries[highlightedCountry].code.toString());
      }
    } else if (e.key === 'Escape') {
      setHighlightedCountry(-1);
    }
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (serviceSearchTimer.current) window.clearTimeout(serviceSearchTimer.current);
      if (countrySearchTimer.current) window.clearTimeout(countrySearchTimer.current);
    };
  }, []);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          SMS Number Activation
        </CardTitle>
        <CardDescription>
          Select a service and activation type to get your SMS number
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="service">Select Service</Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
            <Input
              placeholder="Search services..."
              value={searchService}
              onChange={(e) => setSearchService(e.target.value)}
              onKeyDown={(e) => handleServiceKeyDown(e)}
              className="pl-9 mb-2"
            />
          </div>
          <Select value={service} onValueChange={setService}>
            <SelectTrigger id="service" className="h-12">
              <SelectValue placeholder="Choose a service">
                {service && selectedService && (
                  <div className="flex items-center gap-3">
                    <img 
                      src={(selectedService as any).icon || getServiceLogo(service)} 
                      alt={selectedService.name}
                      className="h-6 w-6 object-contain rounded"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
                    />
                    <span className="font-medium">{selectedService.name}</span>
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="max-h-[300px] bg-background border shadow-lg z-50">
              {filteredServices.map((s, idx) => (
                <SelectItem key={s.code} value={s.code} className={`cursor-pointer ${highlightedService === idx ? 'bg-muted' : ''}`} onMouseEnter={() => setHighlightedService(idx)} onClick={() => setService(s.code)}>
                  <div className="flex items-center gap-3 py-1">
                    <img 
                      src={(s as any).icon || getServiceLogo(s.code)} 
                      alt={s.name}
                      className="h-6 w-6 object-contain rounded"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
                    />
                    <span>{s.name}</span>
                    <span className="ml-auto text-sm text-muted-foreground">{((s as any).basePrice ? `$${((s as any).basePrice * 1.5).toFixed(2)}` : '')}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {service && (
          <div className="space-y-2">
            <Label htmlFor="country">Select Country</Label>
            {loadingCountries ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                  <Input
                    placeholder="Search countries..."
                    value={searchCountry}
                    onKeyDown={(e) => handleCountryKeyDown(e)}
                    onChange={(e) => setSearchCountry(e.target.value)}
                    className="pl-9 mb-2"
                  />
                </div>
                <Select value={country} onValueChange={(v) => setCountry(v)}>
                  <SelectTrigger id="country" className="h-12">
                    <SelectValue placeholder="Choose a country">
                      {country && selectedCountry && (
                        <div className="flex items-center gap-3">
                          <img 
                            src={selectedCountry.flag}
                            alt={selectedCountry.name}
                            className="h-6 w-8 object-cover rounded"
                          />
                          <span className="font-medium">{selectedCountry.name}</span>
                          <span className="ml-auto text-sm text-muted-foreground">
                            ${selectedCountry.price ? (selectedCountry.price * 1.5).toFixed(2) : '—'}
                          </span>
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] bg-background border shadow-lg z-50">
                    {filteredCountries.map((c, idx) => (
                      <SelectItem key={c.code} value={c.code.toString()} className={`cursor-pointer ${highlightedCountry === idx ? 'bg-muted' : ''}`} onMouseEnter={() => setHighlightedCountry(idx)} onClick={() => setCountry(c.code.toString())}>
                        <div className="flex items-center gap-3 w-full py-1">
                          <img 
                            src={c.flag}
                            alt={c.name}
                            className="h-6 w-8 object-cover rounded"
                            onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
                          />
                          <span className="flex-1">{c.name}</span>
                          <span className="text-sm text-muted-foreground">{c.count} available</span>
                          <span className="text-sm font-medium">${c.price ? (c.price * 1.5).toFixed(2) : '—'}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
        )}

        {activationType === "rental" && service && (
          <div className="space-y-2">
            <Label htmlFor="rental-days">Rental Period</Label>
            <Select value={rentalDays} onValueChange={setRentalDays}>
              <SelectTrigger id="rental-days">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-lg z-50">
                <SelectItem value="3">3 days</SelectItem>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="14">14 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {service && (
          <div className="rounded-lg border bg-gradient-to-r from-primary/5 to-secondary/5 p-3 sm:p-4 space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-muted-foreground">Service:</span>
              <span className="font-medium">{selectedService?.name}</span>
            </div>
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-muted-foreground">Type:</span>
              <span className="font-medium capitalize">{activationType}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-muted-foreground">Price:</span>
              <span className="text-xl sm:text-2xl font-bold text-primary">
                Calculated on purchase
              </span>
            </div>
          </div>
        )}

        <Button
          onClick={handleBuy}
          className="w-full"
          size="lg"
          disabled={!service || !country || loading || loadingCountries}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Get Number Now
        </Button>
      </CardContent>
    </Card>
  );
};
