import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard, Loader2, RefreshCw, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { firestoreService } from "@/lib/firestore-service";
import { getUsdToNgnRate, usdToNgn, formatCurrency } from "@/lib/currency";

// Type for FlutterwaveCheckout (global function)
declare global {
  interface Window {
    FlutterwaveCheckout: (config: any) => void;
  }
}

interface TopUpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const TopUpModal = ({ open, onOpenChange, onSuccess }: TopUpModalProps) => {
  const navigate = useNavigate();
  const { user, profile, addToBalance, updateBalance } = useAuth();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<number>(1550);
  const [loadingRate, setLoadingRate] = useState(false);

  const quickAmounts = [5, 10, 25, 50, 100, 250];

  // Load Flutterwave script once
  useEffect(() => {
    if (open) {
      const script = document.createElement("script");
      script.src = "https://checkout.flutterwave.com/v3.js";
      script.async = true;
      document.body.appendChild(script);

      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    }
  }, [open]);

  // Fetch exchange rate when modal opens
  useEffect(() => {
    if (open) {
      fetchExchangeRate();
    }
  }, [open]);

  const fetchExchangeRate = async () => {
    setLoadingRate(true);
    try {
      const result = await getUsdToNgnRate();
      setExchangeRate(result.rate);
    } catch (error) {
      console.error("Error fetching rate:", error);
    } finally {
      setLoadingRate(false);
    }
  };

  const amountNum = parseFloat(amount) || 0;
  const ngnAmount = usdToNgn(amountNum, exchangeRate);

  const handleTopUp = async () => {
    if (!amountNum || amountNum < 1) {
      toast.error("Please enter a valid amount (minimum $1)");
      return;
    }

    if (!user || !profile) {
      toast.error("Please log in to continue");
      return;
    }

    setLoading(true);

    try {
      // Generate unique tx reference
      const txRef = `txn_${Date.now()}_${user.uid.slice(0, 8)}`;

      // Get Flutterwave public key from environment
      const publicKey = import.meta.env.VITE_PUBLIC_FLW_PUBLIC_KEY;

      if (typeof window.FlutterwaveCheckout !== "function") {
        throw new Error("Flutterwave script not loaded yet. Please try again.");
      }

      // Launch Flutterwave checkout
      window.FlutterwaveCheckout({
        public_key: publicKey,
        tx_ref: txRef,
        amount: ngnAmount,
        currency: "NGN",
        payment_options: "card,banktransfer,ussd",
        meta: {
          userId: user.uid,
          amountUSD: amountNum,
          amountNGN: ngnAmount,
          exchangeRate: exchangeRate
        },
        customer: {
          email: profile.email,
          name: profile.displayName || profile.email.split("@")[0],
        },
        customizations: {
          title: "SMSGlobe Top Up",
          description: `Add ${formatCurrency(amountNum, 'USD')} to your balance`,
          logo: "https://smsglobe.lovable.app/favicon.png",
        },
        callback: async (data: any) => {
          console.log("Payment response:", data);
          
          if (data.status === "successful" || data.status === "completed") {
            try {
              // Process payment directly - no server needed!
              const transactionId = String(data.transaction_id || data.id || Date.now());
              
              // Update balance instantly in UI
              addToBalance(amountNum);

              // Update balance in Firestore (background)
              try {
                const result = await firestoreService.processPayment(
                  user.uid,
                  amountNum,
                  ngnAmount,
                  txRef,
                  transactionId
                );
                // Sync with actual balance from Firestore
                if (result.success && result.newBalance !== undefined) {
                  updateBalance(result.newBalance);
                }
              } catch (error) {
                console.error("Error updating balance in Firestore:", error);
                // Revert balance if Firestore update fails
                addToBalance(-amountNum);
                toast.error("Failed to update balance. Please contact support.");
              }

              toast.success(`Successfully added ${formatCurrency(amountNum, 'USD')} to your balance!`, {
                icon: <CheckCircle className="h-4 w-4" />,
                duration: 5000,
                action: {
                  label: "View Receipt",
                  onClick: () => navigate(`/receipt/${txRef}`)
                }
              });

              // Close modal and trigger success callback
              onOpenChange(false);
              onSuccess();
              
              // Navigate to receipt page
              navigate(`/receipt/${txRef}`);
              
            } catch (error) {
              console.error("Error processing payment:", error);
              toast.error("Payment successful but failed to update balance. Please contact support.");
            }
          } else {
            toast.error("Payment failed or was not completed.");
          }
          
          setLoading(false);
        },
        onclose: () => {
          toast.info("Payment cancelled.");
          setLoading(false);
        },
      });
    } catch (error: any) {
      console.error("Top up error:", error);
      toast.error(error?.message || "Failed to start payment. Please try again.");
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Top Up Balance
          </DialogTitle>
          <DialogDescription>
            Add funds to your SMSGlobe account instantly
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Quick Amount Selection */}
          <div className="space-y-2">
            <Label>Select Amount (USD)</Label>
            <div className="grid grid-cols-3 gap-2">
              {quickAmounts.map((amt) => (
                <Button
                  key={amt}
                  variant={amount === amt.toString() ? "default" : "outline"}
                  onClick={() => setAmount(amt.toString())}
                  className="w-full text-sm"
                  size="sm"
                >
                  ${amt}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="custom-amount">Custom Amount (USD)</Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-muted-foreground font-medium">$</span>
              <Input
                id="custom-amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-7"
                min="1"
                step="0.01"
              />
            </div>
          </div>

          {/* Exchange Rate & NGN Amount Display */}
          {amountNum > 0 && (
            <Card className="bg-muted/50">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Exchange Rate</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">1 USD = {formatCurrency(exchangeRate, 'NGN')}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={fetchExchangeRate}
                      disabled={loadingRate}
                    >
                      <RefreshCw className={`h-3 w-3 ${loadingRate ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">You will pay</span>
                  <span className="text-lg font-bold text-primary">{formatCurrency(ngnAmount, 'NGN')}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Balance will receive</span>
                  <span className="font-medium text-success">{formatCurrency(amountNum, 'USD')}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          <Button
            onClick={handleTopUp}
            disabled={!amount || amountNum < 1 || loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>Pay {amountNum > 0 ? formatCurrency(ngnAmount, 'NGN') : '₦0.00'}</>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Secure payment powered by Flutterwave. Funds credited immediately after confirmation.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};