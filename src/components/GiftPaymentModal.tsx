import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/currency";
import { Gift } from "@/lib/gift-service";
import { SavedAddress } from "@/lib/address-service";
import { 
  Package, 
  MapPin, 
  CreditCard, 
  AlertTriangle, 
  Clock,
  RefreshCw,
  Loader2,
  CheckCircle
} from "lucide-react";

interface GiftPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  gift: Gift;
  quantity: number;
  shippingFee: number;
  totalAmount: number;
  currentBalance: number;
  selectedAddress: SavedAddress;
  senderMessage?: string;
  showSenderName: boolean;
  deliveryInstructions?: string;
  preferredDeliveryTime: string;
  targetDeliveryDate: string;
  processing: boolean;
}

export const GiftPaymentModal = ({
  isOpen,
  onClose,
  onConfirm,
  gift,
  quantity,
  shippingFee,
  totalAmount,
  currentBalance,
  selectedAddress,
  senderMessage,
  showSenderName,
  deliveryInstructions,
  preferredDeliveryTime,
  targetDeliveryDate,
  processing
}: GiftPaymentModalProps) => {
  const [confirmed, setConfirmed] = useState(false);
  const remainingBalance = currentBalance - totalAmount;
  const canAfford = currentBalance >= totalAmount;

  const handleConfirm = async () => {
    if (!canAfford || !confirmed) return;
    await onConfirm();
  };

  const formatDeliveryTime = (time: string) => {
    switch (time) {
      case 'morning': return 'Morning (8AM - 12PM)';
      case 'afternoon': return 'Afternoon (12PM - 5PM)';
      case 'evening': return 'Evening (5PM - 8PM)';
      default: return 'Anytime';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Confirm Gift Purchase
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Gift Summary */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <img
                  src={gift.images[0] || '/placeholder.png'}
                  alt={gift.title}
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h3 className="font-semibold">{gift.title}</h3>
                  <p className="text-sm text-muted-foreground">Quantity: {quantity}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">{gift.sizeClass}</Badge>
                    {gift.isFragile && (
                      <Badge variant="destructive" className="text-xs">Fragile</Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(gift.basePrice * quantity, 'USD')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Details */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Delivery Address</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedAddress.recipientName}<br />
                      {selectedAddress.addressLine}<br />
                      {selectedAddress.city}, {selectedAddress.countryName}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Delivery Preferences</p>
                    <p className="text-sm text-muted-foreground">
                      Target Date: {new Date(targetDeliveryDate).toLocaleDateString()}<br />
                      Preferred Time: {formatDeliveryTime(preferredDeliveryTime)}
                    </p>
                  </div>
                </div>

                {senderMessage && (
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-sm font-medium">Your Message:</p>
                    <p className="text-sm text-muted-foreground italic">"{senderMessage}"</p>
                    {showSenderName && (
                      <p className="text-xs text-muted-foreground mt-1">
                        (Your name will be shown to recipient)
                      </p>
                    )}
                  </div>
                )}

                {deliveryInstructions && (
                  <div className="text-sm">
                    <p className="font-medium">Delivery Instructions:</p>
                    <p className="text-muted-foreground">{deliveryInstructions}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Summary */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Gift Price ({quantity}x)</span>
                  <span>{formatCurrency(gift.basePrice * quantity, 'USD')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping Fee</span>
                  <span>{formatCurrency(shippingFee, 'USD')}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total Amount</span>
                  <span>{formatCurrency(totalAmount, 'USD')}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Balance Information */}
          <Card className={!canAfford ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CreditCard className={`h-5 w-5 ${!canAfford ? "text-red-500" : "text-green-500"}`} />
                <div className="flex-1">
                  <p className="font-medium">Account Balance</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Current Balance:</span>
                      <span className="font-medium">{formatCurrency(currentBalance, 'USD')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Order Total:</span>
                      <span className="font-medium">-{formatCurrency(totalAmount, 'USD')}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Remaining Balance:</span>
                      <span className={remainingBalance < 0 ? "text-red-600" : "text-green-600"}>
                        {formatCurrency(remainingBalance, 'USD')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {!canAfford && (
                <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">Insufficient Balance</span>
                  </div>
                  <p className="text-sm text-red-600 mt-1">
                    You need {formatCurrency(totalAmount - currentBalance, 'USD')} more to complete this purchase.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Refund Policy */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <RefreshCw className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">Refund & Cancellation Policy</p>
                  <div className="text-sm text-blue-700 mt-1 space-y-1">
                    <p>• <strong>24-hour window:</strong> Full refund available for order cancellation</p>
                    <p>• <strong>After 24 hours:</strong> Contact support for assistance</p>
                    <p>• <strong>Processing time:</strong> Refunds processed within 3-5 business days</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Confirmation Checkbox */}
          {canAfford && (
            <div className="flex items-start space-x-3 p-4 bg-muted/50 rounded-lg">
              <input
                type="checkbox"
                id="confirm-purchase"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-1"
              />
              <label htmlFor="confirm-purchase" className="text-sm cursor-pointer">
                I understand the refund policy and confirm that I want to send this gift. 
                The amount of <strong>{formatCurrency(totalAmount, 'USD')}</strong> will be 
                deducted from my account balance.
              </label>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={processing}
              className="flex-1"
            >
              Cancel
            </Button>
            
            {canAfford ? (
              <Button
                onClick={handleConfirm}
                disabled={!confirmed || processing}
                className="flex-1"
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Confirm & Send Gift
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={() => window.open('/top-up', '_blank')}
                className="flex-1"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Top Up Balance
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};