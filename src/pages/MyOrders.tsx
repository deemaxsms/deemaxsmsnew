import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { giftService, GiftOrder } from "@/lib/gift-service";
import { useAuth } from "@/lib/auth-context";
import { formatCurrency } from "@/lib/currency";
import { toast } from "sonner";
import { 
  collection, 
  query, 
  where, 
  getDocs 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  Package, 
  Calendar, 
  MapPin, 
  Eye,
  Gift,
  Clock,
  CheckCircle,
  Truck,
  AlertCircle,
  ExternalLink
} from "lucide-react";
import { format } from "date-fns";

const MyOrders = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [orders, setOrders] = useState<GiftOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      console.log(`📦 Loading orders for user: ${user.uid}`);
      const userOrders = await giftService.getUserOrders(user.uid);
      setOrders(userOrders);
      console.log(`✅ Loaded ${userOrders.length} orders`);
    } catch (error) {
      console.error('❌ Error loading orders:', error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending_payment':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'processing':
        return <Package className="h-4 w-4 text-blue-500" />;
      case 'shipped':
        return <Truck className="h-4 w-4 text-purple-500" />;
      case 'out_for_delivery':
        return <Truck className="h-4 w-4 text-orange-500" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Package className="h-4 w-4 text-gray-500" />;
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
        return 'Confirmed';
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
        return 'Unknown';
    }
  };

  const filterOrders = (status: string) => {
    switch (status) {
      case 'pending':
        return orders.filter(order => order.status === 'pending_payment');
      case 'active':
        return orders.filter(order => 
          ['confirmed', 'processing', 'shipped', 'out_for_delivery'].includes(order.status)
        );
      case 'completed':
        return orders.filter(order => order.status === 'delivered');
      case 'cancelled':
        return orders.filter(order => order.status === 'cancelled');
      default:
        return orders;
    }
  };

  const handleViewOrder = async (order: GiftOrder) => {
    try {
      // Get the actual tracking code from the database
      const trackingQuery = query(
        collection(db, 'tracking_links'),
        where('orderId', '==', order.id),
        where('isActive', '==', true)
      );
      
      const trackingSnapshot = await getDocs(trackingQuery);
      
      if (!trackingSnapshot.empty) {
        const trackingDoc = trackingSnapshot.docs[0];
        const trackingCode = trackingDoc.data().trackingCode;
        navigate(`/gift-tracking/${trackingCode}`);
      } else {
        toast.error("Tracking information not found for this order");
      }
    } catch (error) {
      console.error('Error finding tracking code:', error);
      toast.error("Failed to load tracking information");
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
              You need to be logged in to view your orders.
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

  const filteredOrders = filterOrders(activeTab);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 px-3 py-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">My Gift Orders</h1>
                <p className="text-sm text-muted-foreground">
                  Track and manage your gift deliveries
                </p>
              </div>
              <div className="p-3 bg-white rounded-lg shadow-sm border">
                <p className="text-xs text-muted-foreground">Account Balance</p>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(profile?.balance || 0, 'USD')}
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
            <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 h-auto">
              <TabsTrigger value="all" className="text-xs py-2">
                <div className="text-center">
                  <div>All</div>
                  <div className="text-xs opacity-70">({orders.length})</div>
                </div>
              </TabsTrigger>
              <TabsTrigger value="pending" className="text-xs py-2">
                <div className="text-center">
                  <div>Pending</div>
                  <div className="text-xs opacity-70">({filterOrders('pending').length})</div>
                </div>
              </TabsTrigger>
              <TabsTrigger value="active" className="text-xs py-2">
                <div className="text-center">
                  <div>Active</div>
                  <div className="text-xs opacity-70">({filterOrders('active').length})</div>
                </div>
              </TabsTrigger>
              <TabsTrigger value="completed" className="text-xs py-2 hidden sm:flex">
                <div className="text-center">
                  <div>Done</div>
                  <div className="text-xs opacity-70">({filterOrders('completed').length})</div>
                </div>
              </TabsTrigger>
              <TabsTrigger value="cancelled" className="text-xs py-2 hidden sm:flex">
                <div className="text-center">
                  <div>Cancelled</div>
                  <div className="text-xs opacity-70">({filterOrders('cancelled').length})</div>
                </div>
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-4">
                        <div className="flex gap-3">
                          <Skeleton className="h-16 w-16 rounded" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                            <Skeleton className="h-3 w-1/4" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-8">
                  <Gift className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <h3 className="text-base font-semibold mb-2">
                    {activeTab === 'all' ? 'No Orders Yet' : `No ${activeTab} Orders`}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {activeTab === 'all' 
                      ? "You haven't placed any gift orders yet."
                      : `You don't have any ${activeTab} orders.`
                    }
                  </p>
                  {activeTab === 'all' && (
                    <Button onClick={() => navigate("/gifts")} size="sm">
                      <Gift className="mr-2 h-4 w-4" />
                      Browse Gifts
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredOrders.map((order) => (
                    <Card key={order.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex gap-3">
                          {/* Gift Image */}
                          <div className="flex-shrink-0">
                            {order.giftImages.length > 0 ? (
                              <img
                                src={order.giftImages[0]}
                                alt={order.giftTitle}
                                className="w-16 h-16 object-cover rounded-lg"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                                <Gift className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>

                          {/* Order Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <div className="min-w-0 flex-1">
                                <h3 className="font-semibold text-sm truncate">
                                  {order.giftTitle}
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                  #{order.orderNumber}
                                </p>
                              </div>
                              <div className="flex items-center gap-1 ml-2">
                                {getStatusIcon(order.status)}
                                <Badge className={`${getStatusColor(order.status)} text-xs px-2 py-1`}>
                                  {getStatusText(order.status)}
                                </Badge>
                              </div>
                            </div>

                            <div className="space-y-2 text-xs">
                              {/* Recipient */}
                              <div className="flex items-center gap-2">
                                <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                <div className="min-w-0">
                                  <p className="font-medium truncate">{order.recipientName}</p>
                                  <p className="text-muted-foreground truncate">
                                    {order.deliveryAddress.city}, {order.deliveryAddress.countryName}
                                  </p>
                                </div>
                              </div>

                              {/* Date & Amount */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-muted-foreground">
                                    {order.createdAt 
                                      ? format(order.createdAt, "MMM dd, yyyy")
                                      : "Date not available"
                                    }
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="font-medium">
                                    {formatCurrency(order.totalAmount, 'USD')}
                                  </span>
                                  <span className="text-muted-foreground">
                                    (Qty: {order.quantity})
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-wrap gap-2 mt-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewOrder(order)}
                                className="text-xs h-7"
                              >
                                <Eye className="mr-1 h-3 w-3" />
                                View
                              </Button>
                              
                              {order.status === 'pending_payment' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleViewOrder(order)}
                                  className="text-xs h-7"
                                >
                                  Pay Now
                                </Button>
                              )}
                              
                              {order.courierTrackingUrl && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  asChild
                                  className="text-xs h-7"
                                >
                                  <a 
                                    href={order.courierTrackingUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                  >
                                    <ExternalLink className="mr-1 h-3 w-3" />
                                    Track
                                  </a>
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MyOrders;