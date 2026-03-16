import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

const TopUp = () => {
  const navigate = useNavigate();
  const { user, profile, addToBalance, updateBalance } = useAuth();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<number>(1550);
  const [loadingRate, setLoadingRate] = useState(false);

  const quickAmounts = [5, 10, 25, 50, 100, 250];

  // Load Flutterwave script once
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.flutterwave.com/v3.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Fetch exchange rate on mount
  useEffect(() => {
    fetchExchangeRate();
  }, []);

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
        throw new Error("Flutterwave script not loaded yet. Please refresh and try again.");
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
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container px-4 py-12 max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Top Up Your Balance</h1>
          <p className="text-muted-foreground">
            Add funds to your SMSGlobe account instantly with Flutterwave
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Details
            </CardTitle>
            <CardDescription>
              Pay in Nigerian Naira (NGN) and receive USD credit to your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Quick Amount Selection */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Select Amount (USD)</Label>
              <div className="grid grid-cols-3 gap-3">
                {quickAmounts.map((amt) => (
                  <Button
                    key={amt}
                    variant={amount === amt.toString() ? "default" : "outline"}
                    onClick={() => setAmount(amt.toString())}
                    className="w-full"
                    size="lg"
                  >
                    ${amt}
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom Amount Input */}
            <div className="space-y-3">
              <Label htmlFor="custom-amount" className="text-base font-medium">
                Or Enter Custom Amount (USD)
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-muted-foreground font-medium text-lg">$</span>
                <Input
                  id="custom-amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-8 h-12 text-lg"
                  min="1"
                  step="0.01"
                />
              </div>
            </div>

            {/* Exchange Rate & NGN Amount Display */}
            {amountNum > 0 && (
              <Card className="bg-muted/50">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Exchange Rate</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        1 USD = {formatCurrency(exchangeRate, 'NGN')}
                      </span>
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
                    <span className="text-xl font-bold text-primary">
                      {formatCurrency(ngnAmount, 'NGN')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Balance will receive</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(amountNum, 'USD')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Submit Button */}
            <Button
              onClick={handleTopUp}
              disabled={!amount || amountNum < 1 || loading}
              className="w-full h-12 text-lg"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                <>
                  Pay {amountNum > 0 ? formatCurrency(ngnAmount, 'NGN') : '₦0.00'}
                </>
              )}
            </Button>

            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Secure payment powered by Flutterwave
              </p>
              <p className="text-xs text-muted-foreground">
                Funds will be credited to your account immediately after payment confirmation
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default TopUp;