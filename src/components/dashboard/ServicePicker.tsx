import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface ServicePickerProps {
  onBuyNumber: (service: string, country: string) => Promise<void>;
}

export const ServicePicker = ({ onBuyNumber }: ServicePickerProps) => {
  const [service, setService] = useState("");
  const [country, setCountry] = useState("");
  const [loading, setLoading] = useState(false);

  const popularServices = [
    { code: "wa", name: "WhatsApp" },
    { code: "tg", name: "Telegram" },
    { code: "go", name: "Google" },
    { code: "fb", name: "Facebook" },
    { code: "ig", name: "Instagram" },
    { code: "tw", name: "Twitter" },
  ];

  const popularCountries = [
    { code: "0", name: "Russia" },
    { code: "1", name: "Ukraine" },
    { code: "2", name: "Kazakhstan" },
    { code: "6", name: "Indonesia" },
    { code: "7", name: "Malaysia" },
    { code: "12", name: "USA" },
  ];

  const handleBuy = async () => {
    if (!service || !country) return;
    setLoading(true);
    try {
      await onBuyNumber(service, country);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Get a Virtual Number</CardTitle>
        <CardDescription>Select a service and country to receive SMS</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="service">Service</Label>
          <Select value={service} onValueChange={setService}>
            <SelectTrigger id="service">
              <SelectValue placeholder="Select a service" />
            </SelectTrigger>
            <SelectContent>
              {popularServices.map((s) => (
                <SelectItem key={s.code} value={s.code}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger id="country">
              <SelectValue placeholder="Select a country" />
            </SelectTrigger>
            <SelectContent>
              {popularCountries.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleBuy}
          className="w-full"
          disabled={!service || !country || loading}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Buy Number Now
        </Button>
      </CardContent>
    </Card>
  );
};
