/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Loader2, Clock, FileText, Monitor, CheckCircle2 } from "lucide-react";
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

  // Reset local state whenever a new product is selected or modal opens
  useEffect(() => {
    if (open) {
      setDeviceCount(1);
      setFormData({ duration: "", additionalNotes: "" });
    }
  }, [open, product]);

  if (!product) return null;

  // --- CALCULATE MULTIPLIED TOTAL ---
  const unitPrice = Number(product.price) || 0;
  const totalCost = unitPrice * deviceCount;
  const canAfford = profile ? profile.balance >= totalCost : false;

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePurchase = async () => {
    if (!user || !profile) {
      toast.error("Please log in to continue");
      return;
    }

    if (!canAfford) {
      toast.error("Insufficient balance for this quantity.");
      return;
    }

    setLoading(true);

    try {
      logTransaction('purchase_start', user.uid, totalCost, true, { 
        productId: product.id, 
        productName: product.name,
        quantity: deviceCount 
      });
      
      const requestDetails: any = {
        quantity: deviceCount,
        totalAmount: totalCost,
        unitPrice: unitPrice,
        productName: product.name,
        category: product.category
      };
      
      if (formData.duration.trim()) requestDetails.duration = formData.duration.trim();
      if (formData.additionalNotes.trim()) requestDetails.additionalNotes = formData.additionalNotes.trim();
      
      const result = await firestoreService.purchaseProduct(
        user.uid, 
        product.id, 
        requestDetails
      );

      if (result.success) {
        logTransaction('purchase_success', user.uid, totalCost, true, { orderId: result.orderId });
        
        // Instant UI feedback for balance
        deductFromBalance(totalCost);
        
        toast.success(`Success! $${totalCost.toFixed(2)} deducted for ${deviceCount} device(s).`);
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(result.error || "Failed to place order");
      }
    } catch (error) {
      console.error("Purchase error:", error);
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg border-none shadow-2xl overflow-hidden">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-2xl font-black italic">
            <ShoppingCart className="h-6 w-6 text-primary" />
            CONFIRM ORDER
          </DialogTitle>
          <DialogDescription className="font-medium">
            Review your selection for {product.provider}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* PRODUCT CARD SUMMARY */}
          <Card className="bg-muted/40 border-dashed border-primary/20">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest">{product.category}</p>
                  <h3 className="font-black text-xl leading-tight">{product.name}</h3>
                  <p className="text-xs text-muted-foreground font-semibold italic">
                    {product.duration || product.validity || 'Standard Validity'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Unit Price</p>
                  <p className="text-xl font-black text-primary">{formatCurrency(unitPrice, 'USD')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            {/* Quantity Selector */}
            <div className="space-y-2">
              <Label className="text-[11px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Monitor className="h-3 w-3" /> Quantity
              </Label>
              <Select 
                value={deviceCount.toString()} 
                onValueChange={(val) => setDeviceCount(parseInt(val))}
              >
                <SelectTrigger className="h-12 font-bold bg-muted/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 10].map((num) => (
                    <SelectItem key={num} value={num.toString()} className="font-bold">
                      {num} {num === 1 ? 'Device' : 'Devices'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Duration Selector */}
            <div className="space-y-2">
              <Label className="text-[11px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Clock className="h-3 w-3" /> Duration
              </Label>
              <Select onValueChange={(value) => handleInputChange("duration", value)}>
                <SelectTrigger className="h-12 font-bold bg-muted/20">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-month">1 Month</SelectItem>
                  <SelectItem value="3-months">3 Months</SelectItem>
                  <SelectItem value="6-months">6 Months</SelectItem>
                  <SelectItem value="1-year">1 Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-[11px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <FileText className="h-3 w-3" /> Special Instructions
            </Label>
            <Textarea
              placeholder="Enter specific requirements (Region, OS, etc.)"
              value={formData.additionalNotes}
              onChange={(e) => handleInputChange("additionalNotes", e.target.value)}
              className="resize-none bg-muted/20 border-none min-h-[80px]"
            />
          </div>

          <Separator className="opacity-50" />

          {/* TOTAL COST CALCULATION */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm px-1">
              <span className="text-muted-foreground font-bold uppercase">Your Balance</span>
              <span className="font-black text-foreground">{formatCurrency(profile?.balance || 0, 'USD')}</span>
            </div>
            
            <div className="p-4 rounded-2xl bg-primary text-primary-foreground shadow-inner flex justify-between items-center">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Total Due</p>
                <p className="text-3xl font-black tracking-tighter">
                  {formatCurrency(totalCost, 'USD')}
                </p>
              </div>
              <div className="bg-white/20 p-2 rounded-lg">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </div>
          </div>

          <Button
            onClick={handlePurchase}
            disabled={loading || !canAfford}
            className={`w-full h-14 text-lg font-black transition-all duration-300 ${!canAfford ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'shadow-xl shadow-primary/20 hover:scale-[1.01]'}`}
          >
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : !canAfford ? (
              "INSUFFICIENT BALANCE"
            ) : (
              "CONFIRM & PAY NOW"
            )}
          </Button>

          <p className="text-[9px] text-center text-muted-foreground font-bold uppercase tracking-widest opacity-60">
            Automated Delivery via Dashboard & Email
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};