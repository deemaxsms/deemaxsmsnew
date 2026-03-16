import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { giftService, Gift } from "@/lib/gift-service";
import { SavedAddress } from "@/lib/address-service";
import { shippingService } from "@/lib/shipping-service";
import { AddressSelector } from "@/components/AddressSelector";
import { GiftPaymentModal } from "@/components/GiftPaymentModal";
import { useAuth } from "@/lib/auth-context";
import { formatCurrency } from "@/lib/currency";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Heart, 
  Share2, 
  Truck, 
  Package, 
  Shield,
  Clock,
  Star,
  Loader2
} from "lucide-react";

const GiftDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  
  const [gift, setGift] = useState<Gift | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [shippingFee, setShippingFee] = useState<number>(0);
  const [calculatingShipping, setCalculatingShipping] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  // Order form state
  const [quantity, setQuantity] = useState(1);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [selectedAddress, setSelectedAddress] = useState<SavedAddress | null>(null);
  const [senderMessage, setSenderMessage] = useState('');
  const [showSenderName, setShowSenderName] = useState(true);
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [preferredDeliveryTime, setPreferredDeliveryTime] = useState<'morning' | 'afternoon' | 'evening' | 'anytime'>('anytime');
  const [targetDeliveryDate, setTargetDeliveryDate] = useState('');

  useEffect(() => {
    loadGiftDetails();
  }, [slug]);

  useEffect(() => {
    if (selectedAddress && gift) {
      calculateShipping();
    }
  }, [selectedAddress, gift, quantity]);

  const loadGiftDetails = async () => {
    if (!slug) return;
    
    setLoading(true);
    setError(null);
    try {
      console.log(`🎁 Loading gift details for: ${slug}`);
      const giftData = await giftService.getGiftBySlug(slug);
      
      if (!giftData) {
        setError('Gift not found');
        return;
      }
      
      setGift(giftData);
      
      // Set default delivery date (3 days from now)
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 3);
      setTargetDeliveryDate(defaultDate.toISOString().split('T')[0]);
      
      console.log(`✅ Loaded gift: ${giftData.title}`);
    } catch (error) {
      console.error('❌ Error loading gift:', error);
      setError('Failed to load gift details');
    } finally {
      setLoading(false);
    }
  };

  const calculateShipping = async () => {
    if (!gift || !selectedAddress) return;
    
    setCalculatingShipping(true);
    try {
      const calculation = await shippingService.calculateShippingFee(
        {
          id: gift.id,
          title: gift.title,
          weight: gift.weight * quantity,
          sizeClass: gift.sizeClass,
          isFragile: gift.isFragile
        },
        {
          countryCode: selectedAddress.countryCode,
          countryName: selectedAddress.countryName,
          state: selectedAddress.state,
          city: selectedAddress.city,
          latitude: selectedAddress.latitude,
          longitude: selectedAddress.longitude
        }
      );

      setShippingFee(calculation.totalFee);
    } catch (error) {
      console.error('Error calculating shipping:', error);
      setShippingFee(0);
    } finally {
      setCalculatingShipping(false);
    }
  };

  // FIXED: This function only shows the modal - NO PAYMENT
  const handlePurchase = async () => {
    if (!user) {
      toast.error("Please log in to send gifts");
      navigate("/login");
      return;
    }

    if (!gift || !selectedAddressId || !selectedAddress) {
      toast.error("Please select a delivery address");
      return;
    }

    // Check availability
    const isAvailable = await giftService.checkGiftAvailability(gift.id, selectedAddress.countryCode);
    if (!isAvailable) {
      toast.error(`This gift is not available for delivery to ${selectedAddress.countryName}`);
      return;
    }

    // Just show the payment modal - NO PAYMENT YET
    setShowPaymentModal(true);
  };

  // FIXED: This function handles the actual payment
  const handleConfirmPayment = async () => {
    if (!user || !gift || !selectedAddressId || !selectedAddress) return;

    const totalAmount = (gift.basePrice * quantity) + shippingFee;
    
    if (!profile || profile.balance < totalAmount) {
      toast.error("Insufficient balance. Please top up your account.");
      setShowPaymentModal(false);
      navigate("/top-up");
      return;
    }

    setPurchasing(true);
    try {
      console.log(`🎁 Creating gift order: ${gift.title} for ${totalAmount}`);
      
      const orderDetails: any = {
        quantity,
        showSenderName,
        preferredDeliveryTime,
        targetDeliveryDate
      };
      
      // Only include optional fields if they have values
      if (senderMessage && senderMessage.trim()) {
        orderDetails.senderMessage = senderMessage.trim();
      }
      
      if (deliveryInstructions && deliveryInstructions.trim()) {
        orderDetails.deliveryInstructions = deliveryInstructions.trim();
      }
      
      // Step 1: Create order (pending payment)
      const result = await giftService.processGiftPurchase(user.uid, gift.id, selectedAddressId, orderDetails);

      if (result.success && result.orderId) {
        console.log(`✅ Gift order created: ${result.orderNumber}`);
        
        // Step 2: Process payment (this updates Firestore balance and creates transaction)
        const paymentResult = await giftService.processGiftPayment(user.uid, result.orderId, totalAmount);
        
        if (paymentResult.success) {
          // Step 3: Refresh profile to get updated balance from Firestore
          await refreshProfile();
          
          toast.success(`🎁 Gift sent successfully! Order #${result.orderNumber}`);
          
          // Close modal and navigate to tracking
          setShowPaymentModal(false);
          navigate(`/gift-tracking/${result.trackingCode}`);
        } else {
          toast.error(paymentResult.error || "Payment processing failed. Please check your orders.");
          setShowPaymentModal(false);
          navigate(`/gift-tracking/${result.trackingCode}`);
        }
      } else {
        console.error(`❌ Gift order creation failed: ${result.error}`);
        toast.error(result.error || "Failed to create gift order");
      }
    } catch (error) {
      console.error("❌ Gift purchase error:", error);
      toast.error("Failed to complete gift purchase");
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <Skeleton className="h-96 w-full rounded-lg mb-4" />
                <div className="flex gap-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-20 rounded" />
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!gift && !loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h1 className="text-2xl font-bold mb-2">
              {error || "Gift Not Found"}
            </h1>
            <p className="text-muted-foreground mb-6">
              {error === 'Gift not found' 
                ? "Sorry, we couldn't find the gift you're looking for."
                : "There was an error loading the gift details."
              }
            </p>
            <div className="space-x-4">
              <Button onClick={() => navigate("/gifts")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Gift Catalog
              </Button>
              {error && error !== 'Gift not found' && (
                <Button variant="outline" onClick={loadGiftDetails}>
                  Try Again
                </Button>
              )}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const totalAmount = (gift.basePrice * quantity) + shippingFee;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <Button variant="ghost" onClick={() => navigate("/gifts")} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Gifts
          </Button>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Gift Images */}
            <div>
              <div className="relative mb-4">
                <img
                  src={gift.images[0] || '/placeholder.png'}
                  alt={gift.title}
                  className="w-full h-96 object-cover rounded-lg"
                />
                <div className="absolute top-4 right-4 flex gap-2">
                  <Button size="icon" variant="secondary">
                    <Heart className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="secondary">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
                {gift.isFragile && (
                  <Badge className="absolute top-4 left-4" variant="destructive">
                    <Shield className="h-3 w-3 mr-1" />
                    Fragile
                  </Badge>
                )}
              </div>
              
              {/* Thumbnail Images */}
              {gift.images.length > 1 && (
                <div className="flex gap-2">
                  {gift.images.slice(0, 4).map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`${gift.title} ${index + 1}`}
                      className="w-20 h-20 object-cover rounded cursor-pointer hover:opacity-80"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Gift Details & Order Form */}
            <div className="space-y-6">
              {/* Gift Info */}
              <div>
                <h1 className="text-3xl font-bold mb-2">{gift.title}</h1>
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-2xl font-bold text-primary">
                    {formatCurrency(gift.basePrice, 'USD')}
                  </div>
                  <Badge variant="outline">{gift.sizeClass}</Badge>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Star className="h-4 w-4 fill-current text-yellow-400" />
                    <span>4.8 (124 reviews)</span>
                  </div>
                </div>
                <p className="text-muted-foreground mb-4">{gift.description}</p>
                
                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {gift.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Gift Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span>Weight: {gift.weight}kg</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{gift.handlingTimeDays} day handling</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Order Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Send This Gift</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Quantity */}
                  <div>
                    <Label htmlFor="quantity">Quantity</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                      >
                        -
                      </Button>
                      <Input
                        id="quantity"
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-20 text-center"
                        min="1"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setQuantity(quantity + 1)}
                      >
                        +
                      </Button>
                    </div>
                  </div>

                  {/* Delivery Address */}
                  <AddressSelector
                    selectedAddressId={selectedAddressId}
                    onAddressSelect={setSelectedAddressId}
                    onAddressChange={setSelectedAddress}
                  />

                  {/* Personal Message */}
                  <div>
                    <Label htmlFor="message">Personal Message (Optional)</Label>
                    <Textarea
                      id="message"
                      placeholder="Write a heartfelt message to your loved one..."
                      value={senderMessage}
                      onChange={(e) => setSenderMessage(e.target.value)}
                      rows={3}
                    />
                  </div>

                  {/* Delivery Preferences */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="delivery-time">Preferred Time</Label>
                      <Select value={preferredDeliveryTime} onValueChange={(value: any) => setPreferredDeliveryTime(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="anytime">Anytime</SelectItem>
                          <SelectItem value="morning">Morning</SelectItem>
                          <SelectItem value="afternoon">Afternoon</SelectItem>
                          <SelectItem value="evening">Evening</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="delivery-date">Target Date</Label>
                      <Input
                        id="delivery-date"
                        type="date"
                        value={targetDeliveryDate}
                        onChange={(e) => setTargetDeliveryDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>

                  {/* Delivery Instructions */}
                  <div>
                    <Label htmlFor="instructions">Delivery Instructions (Optional)</Label>
                    <Input
                      id="instructions"
                      placeholder="e.g., Ring doorbell, leave with security..."
                      value={deliveryInstructions}
                      onChange={(e) => setDeliveryInstructions(e.target.value)}
                    />
                  </div>

                  {/* Show Sender Name */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="show-sender"
                      checked={showSenderName}
                      onChange={(e) => setShowSenderName(e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="show-sender">Show my name to recipient</Label>
                  </div>
                </CardContent>
              </Card>

              {/* Order Summary */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Gift Price ({quantity}x)</span>
                      <span>{formatCurrency(gift.basePrice * quantity, 'USD')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="flex items-center gap-1">
                        <Truck className="h-4 w-4" />
                        Shipping
                        {calculatingShipping && <Loader2 className="h-3 w-3 animate-spin" />}
                      </span>
                      <span>
                        {calculatingShipping ? "Calculating..." : formatCurrency(shippingFee, 'USD')}
                      </span>
                    </div>
                    {selectedAddress && (
                      <div className="text-xs text-muted-foreground">
                        to {selectedAddress.city}, {selectedAddress.countryName}
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>{formatCurrency(totalAmount, 'USD')}</span>
                    </div>
                  </div>

                  <Button
                    className="w-full mt-4"
                    size="lg"
                    onClick={handlePurchase}
                    disabled={!selectedAddressId || calculatingShipping}
                  >
                    <Package className="mr-2 h-4 w-4" />
                    Review & Send Gift - {formatCurrency(totalAmount, 'USD')}
                  </Button>

                  {user && profile && (
                    <div className="text-center mt-2 text-sm text-muted-foreground">
                      Your balance: {formatCurrency(profile.balance, 'USD')}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      
      {/* Payment Confirmation Modal */}
      {gift && selectedAddress && (
        <GiftPaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onConfirm={handleConfirmPayment}
          gift={gift}
          quantity={quantity}
          shippingFee={shippingFee}
          totalAmount={totalAmount}
          currentBalance={profile?.balance || 0}
          selectedAddress={selectedAddress}
          senderMessage={senderMessage}
          showSenderName={showSenderName}
          deliveryInstructions={deliveryInstructions}
          preferredDeliveryTime={preferredDeliveryTime}
          targetDeliveryDate={targetDeliveryDate}
          processing={purchasing}
        />
      )}
    </div>
  );
};

export default GiftDetail;