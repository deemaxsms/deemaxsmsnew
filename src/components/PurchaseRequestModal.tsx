/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Loader2, Clock, FileText, Monitor } from "lucide-react";
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
  const [deviceCount, setDeviceCount] = useState(1);
  const [formData, setFormData] = useState({
    duration: "",
    additionalNotes: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!product) return null;

  const totalCost = product.price * deviceCount;

  const handlePurchase = async () => {
    if (!user || !profile) {
      toast.error("Please log in to continue");
      return;
    }

    if (profile.balance < totalCost) {
      toast.error("Insufficient balance for this quantity. Please top up.");
      return;
    }

    setLoading(true);

    try {
      console.log(`🛒 Starting purchase: ${product.name} x${deviceCount} for $${totalCost}`);
      logTransaction('purchase_start', user.uid, totalCost, true, { 
        productId: product.id, 
        productName: product.name,
        quantity: deviceCount 
      });
      
      const requestDetails: any = {
        quantity: deviceCount,
        totalAmount: totalCost
      };
      
      if (formData.duration && formData.duration.trim()) requestDetails.duration = formData.duration.trim();
      if (formData.additionalNotes && formData.additionalNotes.trim()) requestDetails.additionalNotes = formData.additionalNotes.trim();
      
      const result = await firestoreService.purchaseProduct(
        user.uid, 
        product.id, 
        requestDetails
      );

      if (result.success) {
        logTransaction('purchase_success', user.uid, totalCost, true, { orderId: result.orderId });
        
        deductFromBalance(totalCost);
        
        setTimeout(async () => {
          try {
            await monitorTransaction(user.uid, 'purchase', totalCost, `Purchase: ${product.name}`);
            const freshProfile = await firestoreService.getUserProfile(user.uid);
            if (freshProfile) {
              updateBalance(freshProfile.balance);
            }
          } catch (syncError) {
            console.warn("Sync error:", syncError);
          }
        }, 1500);
        
        toast.success(`Order placed successfully for ${deviceCount} device(s)!`);
        onOpenChange(false);
        onSuccess();
        
        // Reset local state
        setDeviceCount(1);
        setFormData({ duration: "", additionalNotes: "" });
      } else {
        toast.error(result.error || "Failed to place order");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logTransaction('purchase_error', user.uid, totalCost, false, { error: errorMessage });
      toast.error(`Failed to complete purchase: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Confirm Purchase
          </DialogTitle>
          <DialogDescription>
            Configure your order for {product.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Product Summary */}
          <Card className="bg-muted/30 border-none">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg">{product.name}</h3>
                  <p className="text-sm text-muted-foreground">{product.category.toUpperCase()} Service</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Unit Price</p>
                  <p className="text-lg font-bold text-primary">
                    {formatCurrency(product.price, 'USD')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          <div className="space-y-4">
            {/* Quantity Selector */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 font-bold">
                <Monitor className="h-4 w-4" />
                Number of Devices
              </Label>
              <Select 
                value={deviceCount.toString()} 
                onValueChange={(val) => setDeviceCount(parseInt(val))}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select quantity" />
                </SelectTrigger>
                <SelectContent>
                  {[...Array(10)].map((_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {i + 1} {i + 1 === 1 ? 'Device' : 'Devices'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="duration" className="flex items-center gap-2 font-bold">
                <Clock className="h-4 w-4" />
                Duration Needed
              </Label>
              <Select onValueChange={(value) => handleInputChange("duration", value)}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-month">1 Month</SelectItem>
                  <SelectItem value="3-months">3 Months</SelectItem>
                  <SelectItem value="6-months">6 Months</SelectItem>
                  <SelectItem value="1-year">1 Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Additional Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="flex items-center gap-2 font-bold">
                <FileText className="h-4 w-4" />
                Additional Notes (Optional)
              </Label>
              <Textarea
                id="notes"
                placeholder="Any special requirements or questions..."
                value={formData.additionalNotes}
                onChange={(e) => handleInputChange("additionalNotes", e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>

          <Separator />

          {/* Final Cost Summary */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground font-medium">Your Current Balance:</span>
              <span className="font-bold">
                {formatCurrency(profile?.balance || 0, 'USD')}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-primary/10 rounded-xl border border-primary/20">
              <span className="font-black uppercase text-sm tracking-tight">Total Payment:</span>
              <span className="text-2xl font-black text-primary">
                {formatCurrency(totalCost, 'USD')}
              </span>
            </div>
          </div>

          {/* Purchase Button */}
          <Button
            onClick={handlePurchase}
            disabled={loading || !profile || profile.balance < totalCost}
            className="w-full h-14 text-lg font-black shadow-lg shadow-primary/20"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              "CONFIRM & PAY"
            )}
          </Button>

          <p className="text-[10px] text-center text-muted-foreground font-medium uppercase tracking-widest">
            Access details will be sent within 24 hours
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};