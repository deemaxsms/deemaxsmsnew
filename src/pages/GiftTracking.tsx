import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { giftService, GiftOrder, TrackingLink } from "@/lib/gift-service";
import { useAuth } from "@/lib/auth-context";
import { formatCurrency } from "@/lib/currency";
import { toast } from "sonner";
import { 
  Package, 
  MapPin, 
  Calendar, 
  User, 
  MessageSquare, 
  Truck, 
  CheckCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  Heart,
  Share2,
  CreditCard,
  Loader2
} from "lucide-react";
import { format } from "date-fns";

const GiftTracking = () => {
  const { trackingCode } = useParams();
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const [order, setOrder] = useState<GiftOrder | null>(null);
  const [trackingLink, setTrackingLink] = useState<TrackingLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (trackingCode) {
      loadTrackingInfo();
    }
  }, [trackingCode]);

  const loadTrackingInfo = async () => {
    if (!trackingCode) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log(`📦 Loading tracking info for: ${trackingCode}`);
      const result = await giftService.getTrackingInfo(trackingCode);
      
      if (result.order && result.trackingLink) {
        setOrder(result.order);
        setTrackingLink(result.trackingLink);
        console.log(`✅ Loaded tracking for order: ${result.order.orderNumber}`);
      } else {
        setError("Tracking information not found. Please check your tracking code.");
      }
    } catch (err) {
      console.error('❌ Error loading tracking info:', err);
      setError("Failed to load tracking information. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending_payment':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      case 'processing':
        return <Package className="h-5 w-5 text-blue-500" />;
      case 'shipped':
        return <Truck className="h-5 w-5 text-purple-500" />;
      case 'out_for_delivery':
        return <Truck className="h-5 w-5 text-orange-500" />;
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'cancelled':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Package className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_payment':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'out_for_delivery':
        return 'bg-orange-100 text-orange-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending_payment':
        return 'Pending Payment';
      case 'confirmed':
        return 'Order Confirmed';
      case 'processing':
        return 'Processing';
      case 'shipped':
        return 'Shipped';
      case 'out_for_delivery':
        return 'Out for Delivery';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Unknown Status';
    }
  };

  const shareTracking = async () => {
    if (navigator.share && trackingCode) {
      try {
        await navigator.share({
          title: `Gift Tracking - ${trackingLink?.giftTitle}`,
          text: `Track your gift delivery`,
          url: window.location.href
        });
      } catch (err) {
        // Fallback to clipboard
        navigator.clipboard.writeText(window.location.href);
      }
    } else if (trackingCode) {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handlePayNow = async () => {
    if (!user || !order) {
      toast.error("Please log in to complete payment");
      return;
    }

    if (!profile || profile.balance < order.totalAmount) {
      toast.error("Insufficient balance. Please top up your account.");
      navigate("/top-up");
      return;
    }

    setProcessing(true);
    try {
      // Process payment through gift service (this will update Firestore balance)
      const paymentResult = await giftService.processGiftPayment(user.uid, order.id, order.totalAmount);
      
      if (paymentResult.success) {
        // Refresh profile to get updated balance from Firestore
        await refreshProfile();
        
        toast.success("Payment completed! Your gift order is now confirmed.");
        
        // Reload tracking info
        await loadTrackingInfo();
      } else {
        toast.error(paymentResult.error || "Payment processing failed. Please try again.");
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Payment failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!user || !order) return;

    const confirmCancel = window.confirm(
      `Are you sure you want to cancel this order?\n\n` +
      `Order: ${order.orderNumber}\n` +
      `Gift: ${order.giftTitle}\n` +
      `Amount: ${formatCurrency(order.totalAmount, 'USD')}\n\n` +
      `${order.paymentStatus === 'completed' 
        ? 'You will receive a full refund within 3-5 business days.' 
        : 'No payment has been processed yet.'}`
    );

    if (!confirmCancel) return;

    setProcessing(true);
    try {
      const result = await giftService.cancelOrder(order.id);
      
      if (result.success) {
        if (result.refundAmount && result.refundAmount > 0) {
          // Refresh profile to get updated balance from Firestore
          await refreshProfile();
          toast.success(`Order cancelled successfully! Refund of ${formatCurrency(result.refundAmount, 'USD')} has been processed.`);
        } else {
          toast.success("Order cancelled successfully!");
        }
        
        // Reload tracking info
        await loadTrackingInfo();
      } else {
        toast.error(result.error || "Failed to cancel order");
      }
    } catch (error) {
      console.error("Cancel error:", error);
      toast.error("Failed to cancel order. Please contact support.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <Skeleton className="h-8 w-64" />
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-32 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !order || !trackingLink) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h1 className="text-2xl font-bold mb-2">Tracking Not Found</h1>
            <p className="text-muted-foreground mb-6">
              {error || "We couldn't find tracking information for this code."}
            </p>
            <div className="space-x-4">
              <Button onClick={loadTrackingInfo}>
                Try Again
              </Button>
              <Button variant="outline" onClick={() => navigate("/gifts")}>
                Browse Gifts
              </Button>
            </div>
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
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">🎁 Gift Tracking</h1>
            <p className="text-muted-foreground">
              Track your gift delivery • Code: {trackingCode}
            </p>
          </div>

          {/* Gift Info Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  {trackingLink.giftTitle}
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={shareTracking}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  <Button variant="outline" size="sm">
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Gift Image */}
                <div>
                  {order.giftImages.length > 0 && (
                    <img
                      src={order.giftImages[0]}
                      alt={order.giftTitle}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  )}
                </div>

                {/* Order Details */}
                <div className="space-y-4">
                  {/* Status */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(order.status)}
                      <Badge className={getStatusColor(order.status)}>
                        {getStatusText(order.status)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Order #{order.orderNumber}
                    </p>
                    
                    {/* Payment Button for Pending Orders */}
                    {order.status === 'pending_payment' && user && order.senderId === user.uid && (
                      <div className="mt-3 space-y-2">
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm font-medium text-yellow-800">Payment Required</p>
                          <p className="text-xs text-yellow-700">
                            Complete payment to confirm your gift order
                          </p>
                        </div>
                        <Button 
                          onClick={handlePayNow}
                          disabled={processing}
                          className="w-full"
                          size="sm"
                        >
                          {processing ? (
                            <>
                              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <CreditCard className="mr-2 h-3 w-3" />
                              Pay Now - {formatCurrency(order.totalAmount, 'USD')}
                            </>
                          )}
                        </Button>
                        {profile && (
                          <p className="text-xs text-center text-muted-foreground">
                            Your balance: {formatCurrency(profile.balance, 'USD')}
                          </p>
                        )}
                        
                        {/* Cancel Order Button (within 24 hours) */}
                        {(order.status === 'pending_payment' || 
                          (order.status === 'confirmed' && 
                           Date.now() - order.createdAt.getTime() <= 24 * 60 * 60 * 1000)) && (
                          <Button 
                            variant="outline"
                            onClick={() => handleCancelOrder()}
                            disabled={processing}
                            className="w-full mt-2"
                            size="sm"
                          >
                            Cancel Order
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Recipient */}
                  <div className="flex items-start gap-2">
                    <User className="h-4 w-4 mt-1 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{order.recipientName}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.deliveryAddress.city}, {order.deliveryAddress.countryName}
                      </p>
                    </div>
                  </div>

                  {/* Sender Message */}
                  {order.senderMessage && (
                    <div className="flex items-start gap-2">
                      <MessageSquare className="h-4 w-4 mt-1 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Message from sender:</p>
                        <p className="text-sm text-muted-foreground italic">
                          "{order.senderMessage}"
                        </p>
                        {order.showSenderName && (
                          <p className="text-xs text-muted-foreground mt-1">
                            - {order.senderName}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Delivery Info */}
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 mt-1 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Expected Delivery:</p>
                      <p className="text-sm text-muted-foreground">
                        {order.estimatedDeliveryDate 
                          ? format(new Date(order.estimatedDeliveryDate), "MMMM dd, yyyy")
                          : "To be determined"
                        }
                      </p>
                    </div>
                  </div>

                  {/* Courier Info */}
                  {order.courierName && order.courierTrackingUrl && (
                    <div className="flex items-start gap-2">
                      <Truck className="h-4 w-4 mt-1 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Courier: {order.courierName}</p>
                        <Button variant="link" size="sm" className="p-0 h-auto" asChild>
                          <a href={order.courierTrackingUrl} target="_blank" rel="noopener noreferrer">
                            Track with {order.courierName}
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  )}
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
              <div className="text-sm">
                <p className="font-medium">{order.recipientName}</p>
                <p>{order.deliveryAddress.addressLine}</p>
                {order.deliveryInstructions && (
                  <p className="text-muted-foreground mt-2">
                    <strong>Instructions:</strong> {order.deliveryInstructions}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Order Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Order Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Order Placed */}
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Order Placed</p>
                    <p className="text-sm text-muted-foreground">
                      {order.createdAt 
                        ? format(order.createdAt, "MMM dd, yyyy 'at' h:mm a")
                        : "Date not available"
                      }
                    </p>
                  </div>
                </div>

                {/* Order Confirmed */}
                {order.confirmedAt && (
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Order Confirmed</p>
                      <p className="text-sm text-muted-foreground">
                        {format(order.confirmedAt, "MMM dd, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                  </div>
                )}

                {/* Shipped */}
                {order.shippedAt && (
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Shipped</p>
                      <p className="text-sm text-muted-foreground">
                        {format(order.shippedAt, "MMM dd, yyyy 'at' h:mm a")}
                      </p>
                      {order.trackingNumber && (
                        <p className="text-xs text-muted-foreground">
                          Tracking: {order.trackingNumber}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Delivered */}
                {order.deliveredAt && (
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Delivered</p>
                      <p className="text-sm text-muted-foreground">
                        {format(order.deliveredAt, "MMM dd, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                  </div>
                )}

                {/* Current Status (if not delivered) */}
                {!order.deliveredAt && (
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      {getStatusIcon(order.status)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{getStatusText(order.status)}</p>
                      <p className="text-sm text-muted-foreground">
                        Current status • {order.updatedAt 
                          ? format(order.updatedAt, "MMM dd, yyyy 'at' h:mm a")
                          : "Date not available"
                        }
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Support */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Need help with your delivery? Our support team is here to help.
                </p>
                <div className="flex justify-center gap-4">
                  <Button variant="outline" size="sm">
                    Contact Support
                  </Button>
                  <Button variant="outline" size="sm">
                    Report Issue
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* View Count */}
          <div className="text-center text-xs text-muted-foreground">
            This tracking page has been viewed {trackingLink.viewCount} time{trackingLink.viewCount !== 1 ? 's' : ''}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default GiftTracking;