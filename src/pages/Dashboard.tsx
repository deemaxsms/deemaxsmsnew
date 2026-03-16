/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BalanceCard } from "@/components/dashboard/BalanceCard";
import { DynamicServicePicker } from "@/components/dashboard/DynamicServicePicker";
import { FeatureSelector } from "@/components/dashboard/FeatureSelector";
import { TopUpModal } from "@/components/dashboard/TopUpModal";
import { ActiveActivations } from "@/components/dashboard/ActiveActivations";
import { useAuth } from "@/lib/auth-context";
import { firestoreService, BalanceTransaction, SMSOrder } from "@/lib/firestore-service";
import { smsApi } from "@/api/sms-api";
import firestoreApi from "@/lib/firestoreApi";
import { formatCurrency } from "@/lib/currency";
import { toast } from "sonner";
import {
  Loader2,
  History,
  TrendingUp,
  ShoppingCart,
  CheckCircle,
  CreditCard,
  Smartphone,
  Globe,
  Shield,
  Plus,
  ArrowRight,
  Package,
  Activity,
  DollarSign,
  Zap,
  Users,
  Star
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TransactionHealthCheck } from "@/components/TransactionHealthCheck";
import { format } from "date-fns";

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, profile, loading: authLoading, processPurchase } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activations, setActivations] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<BalanceTransaction[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [smsOrders, setSmsOrders] = useState<SMSOrder[]>([]);
  const [showTopUp, setShowTopUp] = useState(false);
  const [activationType, setActivationType] = useState("activation");

  // Get the default tab from URL params
  const defaultTab = searchParams.get('tab') || 'activity';

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/login");
      } else {
        loadData();
      }
    }
  }, [user, authLoading, navigate]);

  const loadData = async () => {
    if (!user) return;

    try {
      const [userActivations, userTransactions, userOrders, userSmsOrders] = await Promise.all([
        firestoreService.getUserActivations(user.uid).catch(err => {
          console.warn("Failed to load activations:", err);
          return [];
        }),
        firestoreService.getUserTransactions(user.uid).catch(err => {
          console.warn("Failed to load transactions:", err);
          return [];
        }),
        firestoreApi.getOrdersByUser(user.uid).catch(err => {
          console.warn("Failed to load orders:", err);
          return [];
        }),
        firestoreService.getUserSMSOrders(user.uid).catch(err => {
          console.warn("Failed to load SMS orders:", err);
          return [];
        }),
      ]);
      setActivations(userActivations);
      setTransactions(userTransactions);
      setOrders(userOrders);
      setSmsOrders(userSmsOrders);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyNumber = async (service: string, country: string, price: number, type: string, days?: number) => {
    if (!user) return;

    try {
      setLoading(true);
      toast.info("Purchasing SMS number...");

      // Use the new balance manager for purchase
      const description = `SMS ${type === "rental" ? "rental" : "one-time"} number - ${service}`;
      const result = await processPurchase(price, description);

      if (!result.success) {
        toast.error(result.error || "Failed to purchase SMS number");
        return;
      }

      let apiResult;
      if (type === "rental") {
        // Long-term rental
        apiResult = await smsApi.rentLTR(user.uid, service, days as 3 | 30 || 30);
      } else {
        // One-time activation (ignore country for SMS services)
        apiResult = await smsApi.requestMDN(user.uid, service);
      }

      toast.success(`SMS ${type === "rental" ? "rental" : "one-time"} number purchased successfully!`);
      loadData();
    } catch (error: any) {
      console.error("Error purchasing SMS number:", error);
      toast.error(error.message || "Failed to purchase SMS number");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelActivation = async (id: string) => {
    try {
      await firestoreService.updateActivation(id, { status: 'cancelled' });
      toast.success("Activation cancelled");
      loadData();
    } catch (error) {
      console.error("Error cancelling:", error);
      toast.error("Failed to cancel activation");
    }
  };

  const handleBuySMSNumber = async (service: string, type: 'one-time' | 'long-term', duration?: number) => {
    if (!user) return;

    try {
      setLoading(true);
      toast.info("Purchasing SMS number...");

      // Calculate price
      let price = 0.75; // Base price
      if (type === 'long-term') {
        price = duration === 3 ? 7.50 : 22.50; // 3-day vs 30-day with markup
      } else {
        price = 1.13; // One-time with 50% markup
      }

      // Use the new balance manager for purchase
      const description = `SMS ${type} number - ${service}${duration ? ` (${duration} days)` : ''}`;
      const result = await processPurchase(price, description);

      if (!result.success) {
        toast.error(result.error || "Failed to purchase SMS number");
        return;
      }

      // Simulate API call (in production, this would call the real API)
      console.log(`Purchasing ${type} SMS number for ${service}`, { duration, price });
      
      toast.success(`SMS ${type} number purchased successfully!`);
      loadData();
    } catch (error: any) {
      console.error("Error purchasing SMS:", error);
      toast.error(error.message || "Failed to purchase SMS number");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSMSOrder = async (orderId: string) => {
    try {
      // For now, just update status locally. In future, might need to call API
      await firestoreService.updateSMSOrder(orderId, { status: 'cancelled' });
      toast.success("SMS order cancelled");
      loadData();
    } catch (error) {
      console.error("Error cancelling SMS order:", error);
      toast.error("Failed to cancel SMS order");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const balance = profile?.balance || 0;
  const cashback = profile?.cashback || 0;

  // Calculate comprehensive stats
  const totalSpent = transactions
    .filter(t => t.type === 'purchase')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const totalDeposited = transactions
    .filter(t => t.type === 'deposit')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const activeOrders = orders.filter(o => o.status === 'completed' || o.status === 'pending').length;
  const completedOrders = orders.filter(o => o.status === 'completed').length;
  const activeActivations = activations.filter(a => a.status === 'active' || a.status === 'waiting').length;
  const activeSmsOrders = smsOrders.filter(o => ['pending', 'awaiting_mdn', 'reserved', 'active'].includes(o.status)).length;

  const successRate = orders.length > 0
    ? Math.round((completedOrders / orders.length) * 100)
    : 100;

  // Get recent activity (combine orders and transactions)
  const recentActivity = [
    ...orders.slice(0, 3).map(order => ({
      id: order.id,
      type: 'order',
      title: order.productName,
      description: `Order #${order.id.slice(-8)}`,
      amount: order.amount,
      status: order.status,
      date: order.createdAt?.toDate?.() || new Date(),
      icon: Package
    })),
    ...transactions.slice(0, 3).map(tx => ({
      id: tx.id,
      type: 'transaction',
      title: tx.description,
      description: tx.type.charAt(0).toUpperCase() + tx.type.slice(1),
      amount: tx.amount,
      status: 'completed',
      date: tx.createdAt?.toDate?.() || new Date(),
      icon: tx.type === 'deposit' ? TrendingUp : ShoppingCart
    }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);

  function refreshProfile() {
    throw new Error("Function not implemented.");
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">
      <Header />
      <main className="flex-1">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b">
          <div className="container px-4 py-8 md:py-12">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                  Welcome back, {profile?.displayName || profile?.username || 'User'}!
                </h1>
                <p className="text-muted-foreground text-lg">
                  Manage your services and track your activity
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild size="lg" className="shadow-lg">
                  <Link to="/top-up">
                    <Plus className="h-4 w-4 mr-2" />
                    Top Up Balance
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link to="/orders">
                    <Package className="h-4 w-4 mr-2" />
                    View Orders
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container px-4 py-8">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700 dark:text-green-300">Account Balance</p>
                    <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                      {formatCurrency(balance, 'USD')}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                    <p className="text-2xl font-bold">{activeOrders}</p>
                  </div>
                  <Package className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Services</p>
                    <p className="text-2xl font-bold">{activeActivations + activeSmsOrders}</p>
                  </div>
                  <Activity className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                    <p className="text-2xl font-bold">{successRate}%</p>
                  </div>
                  <Star className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Quick Actions */}
            <div className="lg:col-span-1">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Quick Actions
                  </CardTitle>
                  <CardDescription>
                    Access your favorite services
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button asChild variant="outline" className="w-full justify-start h-auto p-4">
                    <Link to="/vpn-and-proxy" className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-blue-600" />
                      <div className="text-left">
                        <div className="font-medium">VPN & Proxy</div>
                        <div className="text-sm text-muted-foreground">Browse VPN and proxy services</div>
                      </div>
                      <ArrowRight className="h-4 w-4 ml-auto" />
                    </Link>
                  </Button>

                  <Button asChild variant="outline" className="w-full justify-start h-auto p-4">
                    <Link to="/esim" className="flex items-center gap-3">
                      <Smartphone className="h-5 w-5 text-green-600" />
                      <div className="text-left">
                        <div className="font-medium">eSIM Plans</div>
                        <div className="text-sm text-muted-foreground">Global connectivity solutions</div>
                      </div>
                      <ArrowRight className="h-4 w-4 ml-auto" />
                    </Link>
                  </Button>

                  <Button asChild variant="outline" className="w-full justify-start h-auto p-4">
                    <Link to="/top-up" className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-purple-600" />
                      <div className="text-left">
                        <div className="font-medium">Top Up Balance</div>
                        <div className="text-sm text-muted-foreground">Add funds to your account</div>
                      </div>
                      <ArrowRight className="h-4 w-4 ml-auto" />
                    </Link>
                  </Button>

                  <Button asChild variant="outline" className="w-full justify-start h-auto p-4">
                    <Link to="/transactions" className="flex items-center gap-3">
                      <History className="h-5 w-5 text-orange-600" />
                      <div className="text-left">
                        <div className="font-medium">Transaction History</div>
                        <div className="text-sm text-muted-foreground">View all your transactions</div>
                      </div>
                      <ArrowRight className="h-4 w-4 ml-auto" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Transaction Health Check */}
              <div className="mt-6">
                <TransactionHealthCheck />
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2">
              <Tabs defaultValue={defaultTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="activity">Recent Activity</TabsTrigger>
                  <TabsTrigger value="services">Buy Services</TabsTrigger>
                  <TabsTrigger value="active">Active Services</TabsTrigger>
                </TabsList>

                <TabsContent value="activity" className="space-y-4">
                  <Card className="border-0 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Recent Activity
                      </CardTitle>
                      <CardDescription>
                        Your latest orders and transactions
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {recentActivity.length === 0 ? (
                        <div className="text-center py-12">
                          <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                          <h3 className="text-lg font-medium mb-2">No activity yet</h3>
                          <p className="text-muted-foreground mb-6">
                            Start by purchasing a service or topping up your balance
                          </p>
                          <div className="flex gap-3 justify-center">
                            <Button asChild>
                              <Link to="/vpn-and-proxy">Browse Services</Link>
                            </Button>
                            <Button variant="outline" asChild>
                              <Link to="/top-up">Top Up Balance</Link>
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {recentActivity.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                            >
                              <div className={`p-2 rounded-full ${
                                item.type === 'order'
                                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                                  : item.amount > 0
                                    ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
                                    : 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400'
                              }`}>
                                <item.icon className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{item.title}</p>
                                <p className="text-sm text-muted-foreground">
                                  {item.description} • {format(item.date, "MMM dd, h:mm a")}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className={`font-bold ${
                                  item.amount > 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {item.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(item.amount), 'USD')}
                                </p>
                                <Badge variant={item.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                                  {item.status}
                                </Badge>
                              </div>
                            </div>
                          ))}
                          <div className="pt-4 border-t">
                            <Button variant="outline" className="w-full" asChild>
                              <Link to="/transactions">
                                View All Activity
                                <ArrowRight className="h-4 w-4 ml-2" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="services" className="space-y-4">
                  <div className="space-y-6">
                    {/* VPN/Proxy Services */}
                    <Card className="border-0 shadow-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Globe className="h-5 w-5" />
                          VPN & Proxy Services
                        </CardTitle>
                        <CardDescription>
                          Purchase VPN and proxy services for your needs
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <FeatureSelector
                          selectedFeature={activationType}
                          onFeatureChange={setActivationType}
                        >
                          <DynamicServicePicker
                            onBuyNumber={handleBuyNumber}
                            activationType={activationType}
                          />
                        </FeatureSelector>
                      </CardContent>
                    </Card>

                    {/* SMS Services */}
                    <Card className="border-0 shadow-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Smartphone className="h-5 w-5" />
                          SMS Services
                        </CardTitle>
                        <CardDescription>
                          Get temporary and long-term phone numbers for SMS verification
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* One-time SMS */}
                          <Card className="border border-primary/20 bg-primary/5">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-lg">One-time SMS</CardTitle>
                              <CardDescription>
                                Temporary numbers for SMS verification
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="text-center">
                                <div className="text-2xl font-bold text-primary">$0.75</div>
                                <div className="text-sm text-muted-foreground">per number</div>
                              </div>
                              <Button 
                                className="w-full" 
                                onClick={() => handleBuySMSNumber('verification', 'one-time')}
                                disabled={loading}
                              >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Get SMS Number
                              </Button>
                            </CardContent>
                          </Card>

                          {/* Long-term SMS */}
                          <Card className="border border-purple-200 bg-purple-50/50 dark:border-purple-800 dark:bg-purple-950/20">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-lg">Long-term SMS</CardTitle>
                              <CardDescription>
                                Rent numbers for extended periods
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span>3 days:</span>
                                  <span className="font-bold">$7.50</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span>30 days:</span>
                                  <span className="font-bold">$30.00</span>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleBuySMSNumber('verification', 'long-term', 3)}
                                  disabled={loading}
                                >
                                  3 Days
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleBuySMSNumber('verification', 'long-term', 30)}
                                  disabled={loading}
                                >
                                  30 Days
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="active" className="space-y-4">
                  <div className="space-y-6">
                    {/* Regular Activations */}
                    <ActiveActivations
                      activations={activations}
                      onCancel={handleCancelActivation}
                      onRefresh={loadData}
                    />

                    {/* SMS Orders */}
                    {smsOrders.length > 0 && (
                      <Card className="border-0 shadow-sm">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Smartphone className="h-5 w-5" />
                            Active SMS Orders
                          </CardTitle>
                          <CardDescription>
                            Your active SMS number rentals and orders
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {smsOrders
                              .filter(order => ['pending', 'awaiting_mdn', 'reserved', 'active'].includes(order.status))
                              .map((order) => (
                                <div
                                  key={order.id}
                                  className="flex items-center justify-between p-4 rounded-lg border bg-card"
                                >
                                  <div className="flex items-center gap-4">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                      <Smartphone className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                      <div className="font-medium">
                                        {order.service} - {order.orderType}
                                      </div>
                                      <div className="text-sm text-muted-foreground">
                                        {order.mdn ? `Number: ${order.mdn}` : 'Awaiting number assignment'}
                                      </div>
                                      {order.expiresAt && (
                                        <div className="text-xs text-muted-foreground">
                                          Expires: {format(order.expiresAt.toDate(), "MMM dd, yyyy")}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <Badge variant={
                                      order.status === 'active' ? 'default' :
                                      order.status === 'pending' ? 'secondary' :
                                      'outline'
                                    }>
                                      {order.status.replace('_', ' ')}
                                    </Badge>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleCancelSMSOrder(order.id)}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      <TopUpModal
        open={showTopUp}
        onOpenChange={setShowTopUp}
        onSuccess={() => {
          refreshProfile();
          loadData();
        }}
      />
    </div>
  );
};

export default Dashboard;
function refreshProfile() {
  throw new Error("Function not implemented.");
}

