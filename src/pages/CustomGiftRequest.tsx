import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AddressSelector } from "@/components/AddressSelector";
import { useAuth } from "@/lib/auth-context";
import { giftService } from "@/lib/gift-service";
import { SavedAddress } from "@/lib/address-service";
import { formatCurrency } from "@/lib/currency";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Package, 
  DollarSign,
  Calendar,
  MapPin,
  FileImage,
  Loader2
} from "lucide-react";

const CustomGiftRequest = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [selectedAddress, setSelectedAddress] = useState<SavedAddress | null>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budgetMin, setBudgetMin] = useState<number>(50);
  const [budgetMax, setBudgetMax] = useState<number>(500);
  const [preferredBrand, setPreferredBrand] = useState('');
  const [preferredSpecs, setPreferredSpecs] = useState('');
  const [urgencyLevel, setUrgencyLevel] = useState<'normal' | 'urgent'>('normal');
  const [targetDeliveryDate, setTargetDeliveryDate] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Please log in to submit a custom gift request");
      navigate("/login");
      return;
    }

    if (!selectedAddressId || !selectedAddress) {
      toast.error("Please select a delivery address");
      return;
    }

    if (!title.trim() || !description.trim()) {
      toast.error("Please fill in the title and description");
      return;
    }

    setLoading(true);
    try {
      const requestId = await giftService.createCustomGiftRequest(user.uid, {
        title: title.trim(),
        description: description.trim(),
        budgetMin,
        budgetMax,
        preferredBrand: preferredBrand.trim() || undefined,
        preferredSpecs: preferredSpecs.trim() || undefined,
        urgencyLevel,
        targetDeliveryDate,
        deliveryCountry: selectedAddress.countryName,
        deliveryCity: selectedAddress.city,
        addressId: selectedAddressId,
        referenceImages: [] // TODO: Add image upload functionality
      });

      toast.success("Custom gift request submitted successfully! We'll review it and get back to you within 24 hours.");
      navigate("/my-orders");
    } catch (error) {
      console.error("Error submitting custom gift request:", error);
      toast.error("Failed to submit request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h1 className="text-2xl font-bold mb-2">Please Log In</h1>
            <p className="text-muted-foreground mb-6">
              You need to be logged in to submit a custom gift request.
            </p>
            <Button onClick={() => navigate("/login")}>
              Log In
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" onClick={() => navigate("/gifts")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Gifts
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Custom Gift Request</h1>
              <p className="text-muted-foreground">
                Can't find what you're looking for? Let us source it for you!
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Gift Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Gift Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Gift Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., iPhone 15 Pro Max, Custom Jewelry, Luxury Watch..."
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the gift in detail. Include color preferences, size, specific features, or any other requirements..."
                    rows={4}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="brand">Preferred Brand (Optional)</Label>
                    <Input
                      id="brand"
                      value={preferredBrand}
                      onChange={(e) => setPreferredBrand(e.target.value)}
                      placeholder="e.g., Apple, Samsung, Nike..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="specs">Preferred Specifications (Optional)</Label>
                    <Input
                      id="specs"
                      value={preferredSpecs}
                      onChange={(e) => setPreferredSpecs(e.target.value)}
                      placeholder="e.g., 256GB, Size L, Gold color..."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Budget & Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Budget & Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="budget-min">Minimum Budget (USD)</Label>
                    <Input
                      id="budget-min"
                      type="number"
                      value={budgetMin}
                      onChange={(e) => setBudgetMin(Number(e.target.value))}
                      min="10"
                      step="10"
                    />
                  </div>
                  <div>
                    <Label htmlFor="budget-max">Maximum Budget (USD)</Label>
                    <Input
                      id="budget-max"
                      type="number"
                      value={budgetMax}
                      onChange={(e) => setBudgetMax(Number(e.target.value))}
                      min="10"
                      step="10"
                    />
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  Budget range: {formatCurrency(budgetMin, 'USD')} - {formatCurrency(budgetMax, 'USD')}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="urgency">Urgency Level</Label>
                    <Select value={urgencyLevel} onValueChange={(value: any) => setUrgencyLevel(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal (5-7 days)</SelectItem>
                        <SelectItem value="urgent">Urgent (2-3 days) +$50 fee</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="target-date">Target Delivery Date</Label>
                    <Input
                      id="target-date"
                      type="date"
                      value={targetDeliveryDate}
                      onChange={(e) => setTargetDeliveryDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Delivery Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AddressSelector
                  selectedAddressId={selectedAddressId}
                  onAddressSelect={setSelectedAddressId}
                  onAddressChange={setSelectedAddress}
                />
              </CardContent>
            </Card>

            {/* Reference Images */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileImage className="h-5 w-5" />
                  Reference Images (Coming Soon)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                  <FileImage className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Image upload functionality will be available soon. For now, please include detailed descriptions above.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Submit */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">How it works:</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• We'll review your request within 24 hours</li>
                      <li>• Our team will source the best options for you</li>
                      <li>• You'll receive a quote with final pricing and delivery timeline</li>
                      <li>• Once approved, we'll handle the purchase and delivery</li>
                    </ul>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={loading || !selectedAddressId}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting Request...
                      </>
                    ) : (
                      <>
                        <Package className="mr-2 h-4 w-4" />
                        Submit Custom Gift Request
                      </>
                    )}
                  </Button>

                  {profile && (
                    <div className="text-center text-sm text-muted-foreground">
                      Your balance: {formatCurrency(profile.balance, 'USD')}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CustomGiftRequest;