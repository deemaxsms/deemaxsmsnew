import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Loader2, MapPin, Clock, Settings, FileText } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { firestoreService, ProductListing } from "@/lib/firestore-service";
import { formatCurrency } from "@/lib/currency";
import { monitorTransaction, logTransaction } from "@/lib/transaction-monitor";

interface PurchaseRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: ProductListing | null;
  onSuccess: () => void;
}

export const PurchaseRequestModal = ({ open, onOpenChange, product, onSuccess }: PurchaseRequestModalProps) => {
  const { user, profile, deductFromBalance, updateBalance } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    location: "",
    duration: "",
    specifications: "",
    additionalNotes: "",
    // Gift card specific fields
    recipientEmail: "",
    recipientName: "",
    giftMessage: "",
    // RDP specific fields
    preferredOS: "",
    intendedUse: ""
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePurchase = async () => {
    if (!product || !user || !profile) {
      toast.error("Please log in to continue");
      return;
    }

    if (profile.balance < product.price) {
      toast.error("Insufficient balance. Please top up your account.");
      return;
    }

    setLoading(true);

    try {
      console.log(`🛒 Starting purchase: ${product.name} for $${product.price}`);
      logTransaction('purchase_start', user.uid, product.price, true, { productId: product.id, productName: product.name });
      
      // Create order with request details - NO UI balance change until success
      // Clean request details to avoid undefined values
      const requestDetails: any = {};
      if (formData.location && formData.location.trim()) requestDetails.location = formData.location.trim();
      if (formData.duration && formData.duration.trim()) requestDetails.duration = formData.duration.trim();
      if (formData.specifications && formData.specifications.trim()) requestDetails.specifications = formData.specifications.trim();
      if (formData.additionalNotes && formData.additionalNotes.trim()) requestDetails.additionalNotes = formData.additionalNotes.trim();
      
      // Add gift card specific fields
      if (isGift) {
        if (formData.recipientEmail && formData.recipientEmail.trim()) requestDetails.recipientEmail = formData.recipientEmail.trim();
        if (formData.recipientName && formData.recipientName.trim()) requestDetails.recipientName = formData.recipientName.trim();
        if (formData.giftMessage && formData.giftMessage.trim()) requestDetails.giftMessage = formData.giftMessage.trim();
      }
      
      // Add RDP specific fields
      if (isRDP) {
        if (formData.preferredOS && formData.preferredOS.trim()) requestDetails.preferredOS = formData.preferredOS.trim();
        if (formData.intendedUse && formData.intendedUse.trim()) requestDetails.intendedUse = formData.intendedUse.trim();
      }
      
      const result = await firestoreService.purchaseProduct(
        user.uid, 
        product.id, 
        Object.keys(requestDetails).length > 0 ? requestDetails : undefined
      );

      if (result.success) {
        console.log(`✅ Purchase successful: Order ${result.orderId}`);
        logTransaction('purchase_success', user.uid, product.price, true, { orderId: result.orderId });
        
        // Deduct balance in UI
        deductFromBalance(product.price);
        
        // Monitor transaction integrity
        setTimeout(async () => {
          try {
            const monitoring = await monitorTransaction(
              user.uid, 
              'purchase', 
              product.price, 
              `Purchase: ${product.name}`
            );
            
            if (!monitoring.success) {
              console.warn('⚠️ Transaction monitoring detected issues:', monitoring.warnings);
              // Could show a warning toast or trigger auto-fix
            }
            
            // Sync balance from server to ensure accuracy
            const freshProfile = await firestoreService.getUserProfile(user.uid);
            if (freshProfile && profile) {
              updateBalance(freshProfile.balance);
              console.log(`🔄 Balance synced from server: ${freshProfile.balance}`);
            }
          } catch (syncError) {
            console.warn("Failed to sync balance or monitor transaction:", syncError);
          }
        }, 1500);
        
        toast.success("Order placed successfully! You'll receive your details once processed.");
        onOpenChange(false);
        onSuccess();
        
        // Reset form
        setFormData({
          location: "",
          duration: "",
          specifications: "",
          additionalNotes: "",
          recipientEmail: "",
          recipientName: "",
          giftMessage: "",
          preferredOS: "",
          intendedUse: ""
        });
      } else {
        console.error(`❌ Purchase failed: ${result.error}`);
        logTransaction('purchase_failed', user.uid, product.price, false, { error: result.error });
        toast.error(result.error || "Failed to place order");
      }
    } catch (error) {
      console.error("❌ Purchase error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      logTransaction('purchase_error', user.uid, product.price, false, { error: errorMessage });
      toast.error(`Failed to complete purchase: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  if (!product) return null;

  const isVPN = product.category === 'vpn';
  const isProxy = product.category === 'proxy';
  const isESIM = product.category === 'esim';
  const isRDP = product.category === 'rdp';
  const isGift = product.category === 'gift';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Purchase Request
          </DialogTitle>
          <DialogDescription>
            Provide details for your {product.name} order
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Product Summary */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{product.name}</h3>
                  <p className="text-sm text-muted-foreground">{product.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">
                    {formatCurrency(product.price, 'USD')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Request Form */}
          <div className="space-y-4">
            <h4 className="font-medium">Request Details</h4>

            {/* Location/Region */}
            {(isVPN || isProxy || isESIM) && (
              <div className="space-y-2">
                <Label htmlFor="location" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {isESIM ? "Country/Region" : "Preferred Location"}
                </Label>
                <Input
                  id="location"
                  placeholder={
                    isESIM 
                      ? "e.g., United States, Europe, Asia" 
                      : isVPN 
                        ? "e.g., United States, Germany, Japan" 
                        : "e.g., US, UK, Canada"
                  }
                  value={formData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                />
              </div>
            )}

            {/* Gift Card Recipient Details */}
            {isGift && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="recipientEmail" className="flex items-center gap-2">
                    <Gift className="h-4 w-4" />
                    Recipient Email (Optional)
                  </Label>
                  <Input
                    id="recipientEmail"
                    type="email"
                    placeholder="recipient@example.com (leave empty to send to yourself)"
                    value={formData.recipientEmail}
                    onChange={(e) => handleInputChange("recipientEmail", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recipientName" className="flex items-center gap-2">
                    <Gift className="h-4 w-4" />
                    Recipient Name (Optional)
                  </Label>
                  <Input
                    id="recipientName"
                    placeholder="e.g., John Doe"
                    value={formData.recipientName}
                    onChange={(e) => handleInputChange("recipientName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="giftMessage" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Gift Message (Optional)
                  </Label>
                  <Textarea
                    id="giftMessage"
                    placeholder="Happy Birthday! Hope you enjoy this gift card..."
                    value={formData.giftMessage}
                    onChange={(e) => handleInputChange("giftMessage", e.target.value)}
                    rows={3}
                  />
                </div>
              </>
            )}

            {/* RDP Specific Fields */}
            {isRDP && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="preferredOS" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Preferred Operating System
                  </Label>
                  <Select onValueChange={(value) => handleInputChange("preferredOS", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select OS preference" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="windows-10">Windows 10</SelectItem>
                      <SelectItem value="windows-11">Windows 11</SelectItem>
                      <SelectItem value="windows-server">Windows Server</SelectItem>
                      <SelectItem value="ubuntu">Ubuntu Linux</SelectItem>
                      <SelectItem value="centos">CentOS Linux</SelectItem>
                      <SelectItem value="no-preference">No Preference</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="intendedUse" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Intended Use
                  </Label>
                  <Select onValueChange={(value) => handleInputChange("intendedUse", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="What will you use this RDP for?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="development">Software Development</SelectItem>
                      <SelectItem value="testing">Testing & QA</SelectItem>
                      <SelectItem value="business">Business Applications</SelectItem>
                      <SelectItem value="gaming">Gaming</SelectItem>
                      <SelectItem value="browsing">Web Browsing</SelectItem>
                      <SelectItem value="trading">Trading & Finance</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="duration" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Duration Needed
              </Label>
              <Select onValueChange={(value) => handleInputChange("duration", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-month">1 Month</SelectItem>
                  <SelectItem value="3-months">3 Months</SelectItem>
                  <SelectItem value="6-months">6 Months</SelectItem>
                  <SelectItem value="1-year">1 Year</SelectItem>
                  <SelectItem value="custom">Custom Duration</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Specifications */}
            {!isGift && (
              <div className="space-y-2">
                <Label htmlFor="specifications" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  {isRDP ? "System Requirements" : isESIM ? "Data Requirements" : "Specifications"}
                </Label>
                <Textarea
                  id="specifications"
                  placeholder={
                    isRDP 
                      ? "e.g., Specific software needs, performance requirements"
                      : isESIM 
                        ? "e.g., 5GB data, unlimited calls, specific carrier preference"
                        : isVPN
                          ? "e.g., Number of devices, streaming requirements, protocols"
                          : "e.g., Number of IPs, authentication type, protocols"
                  }
                  value={formData.specifications}
                  onChange={(e) => handleInputChange("specifications", e.target.value)}
                  rows={3}
                />
              </div>
            )}

            {/* Additional Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {isGift ? "Special Instructions (Optional)" : "Additional Notes (Optional)"}
              </Label>
              <Textarea
                id="notes"
                placeholder={
                  isGift 
                    ? "Any special delivery instructions or preferences..."
                    : "Any special requirements or questions..."
                }
                value={formData.additionalNotes}
                onChange={(e) => handleInputChange("additionalNotes", e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <Separator />

          {/* Balance Check */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Your Balance:</span>
            <span className="font-medium">
              {formatCurrency(profile?.balance || 0, 'USD')}
            </span>
          </div>

          {/* Purchase Button */}
          <Button
            onClick={handlePurchase}
            disabled={loading || !profile || profile.balance < product.price}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing Order...
              </>
            ) : (
              <>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Place Order - {formatCurrency(product.price, 'USD')}
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Your order will be processed within 24 hours. You'll receive your access details via email and in your order history.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};