/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
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
  const { user, profile, loading: authLoading, processPurchase, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activations, setActivations] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<BalanceTransaction[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [smsOrders, setSmsOrders] = useState<SMSOrder[]>([]);
  const [showTopUp, setShowTopUp] = useState(false);
  const [activationType, setActivationType] = useState("activation");

  const defaultTab = searchParams.get('tab') || 'activity';

  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      const [userActivations, userTransactions, userOrders, userSmsOrders] = await Promise.all([
        firestoreService.getUserActivations(user.uid).catch(() => []),
        firestoreService.getUserTransactions(user.uid).catch(() => []),
        firestoreApi.getOrdersByUser(user.uid).catch(() => []),
        firestoreService.getUserSMSOrders(user.uid).catch(() => []),
      ]);
      
      setActivations(userActivations);
      setTransactions(userTransactions);
      setOrders(userOrders);
      setSmsOrders(userSmsOrders);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/login");
      } else {
        loadData();
      }
    }
  }, [user, authLoading, navigate, loadData]);

  const handleBuyNumber = async (service: string, country: string, price: number, type: string, days?: number) => {
    if (!user) return;

    try {
      setLoading(true);
      const description = `SMS ${type === "rental" ? "rental" : "one-time"} number - ${service}`;
      
      const result = await processPurchase(price, description);

      if (!result.success) {
        toast.error(result.error || "Failed to purchase SMS number");
        return;
      }

      if (type === "rental") {
        await smsApi.rentLTR(user.uid, service, (days as 3 | 30) || 30);
      } else {
        await smsApi.requestMDN(user.uid, service);
      }

      toast.success(`SMS ${type === "rental" ? "rental" : "one-time"} number purchased successfully!`);
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Failed to purchase SMS number");
    } finally {
      setLoading(false);
    }
  };

  const handleBuySMSNumber = async (service: string, type: 'one-time' | 'long-term', duration?: number) => {
    if (!user) return;

    try {
      setLoading(true);
      let price = type === 'long-term' ? (duration === 3 ? 7.50 : 22.50) : 1.13;

      const description = `SMS ${type} number - ${service}${duration ? ` (${duration} days)` : ''}`;
      const result = await processPurchase(price, description);

      if (!result.success) {
        toast.error(result.error || "Failed to purchase SMS number");
        return;
      }

      toast.success(`SMS ${type} number purchased successfully!`);
      loadData();
    } catch (error: any) {
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
      toast.error("Failed to cancel activation");
    }
  };

  const handleCancelSMSOrder = async (orderId: string) => {
    try {
      await firestoreService.updateSMSOrder(orderId, { status: 'cancelled' });
      toast.success("SMS order cancelled");
      loadData();
    } catch (error) {
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
  const activeOrdersCount = orders.filter(o => o.status === 'completed' || o.status === 'pending').length;
  const activeSmsCount = smsOrders.filter(o => ['pending', 'active'].includes(o.status)).length;
  const successRate = orders.length > 0 ? Math.round((orders.filter(o => o.status === 'completed').length / orders.length) * 100) : 100;

  const recentActivity = [
    ...orders.slice(0, 3).map(order => ({
      id: order.id,
      type: 'order',
      title: order.productName,
      description: `Order #${order.id.slice(-8)}`,
      amount: -order.amount,
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

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">
      <Header />
      <main className="flex-1">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b">
          <div className="container px-4 py-8 md:py-12">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                  Welcome back, {profile?.displayName || profile?.username || 'User'}!
                </h1>
                <p className="text-muted-foreground text-lg">Manage your services and track activity</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={() => setShowTopUp(true)} size="lg" className="shadow-lg">
                  <Plus className="h-4 w-4 mr-2" /> Top Up Balance
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link to="/orders"><Package className="h-4 w-4 mr-2" /> View Orders</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Account Balance</p>
                  <p className="text-2xl font-bold text-green-800">{formatCurrency(balance, 'USD')}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold">{activeOrdersCount}</p>
                </div>
                <Package className="h-8 w-8 text-blue-600" />
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Services</p>
                  <p className="text-2xl font-bold">{activations.length + activeSmsCount}</p>
                </div>
                <Activity className="h-8 w-8 text-purple-600" />
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold">{successRate}%</p>
                </div>
                <Star className="h-8 w-8 text-yellow-600" />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5" /> Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button asChild variant="outline" className="w-full justify-start h-auto p-4">
                    <Link to="/vpn-and-proxy" className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-blue-600" />
                      <div className="text-left">
                        <div className="font-medium">VPN & Proxy</div>
                        <div className="text-sm text-muted-foreground">Secure your browsing</div>
                      </div>
                      <ArrowRight className="h-4 w-4 ml-auto" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-start h-auto p-4">
                    <Link to="/transactions" className="flex items-center gap-3">
                      <History className="h-5 w-5 text-orange-600" />
                      <div className="text-left">
                        <div className="font-medium">History</div>
                        <div className="text-sm text-muted-foreground">View all transactions</div>
                      </div>
                      <ArrowRight className="h-4 w-4 ml-auto" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
              <TransactionHealthCheck />
            </div>

            <div className="lg:col-span-2">
              <Tabs defaultValue={defaultTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                  <TabsTrigger value="services">Buy</TabsTrigger>
                  <TabsTrigger value="active">Active</TabsTrigger>
                </TabsList>

                <TabsContent value="activity">
                  <Card className="border-0 shadow-sm">
                    <CardHeader>
                      <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {recentActivity.map((item) => (
                        <div key={item.id} className="flex items-center gap-4 p-4 rounded-lg border bg-card">
                          <div className="p-2 bg-blue-50 rounded-full"><item.icon className="h-4 w-4 text-blue-600" /></div>
                          <div className="flex-1">
                            <p className="font-medium">{item.title}</p>
                            <p className="text-xs text-muted-foreground">{format(item.date, "MMM dd, h:mm a")}</p>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${item.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {item.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(item.amount), 'USD')}
                            </p>
                            <Badge variant="secondary" className="text-[10px]">{item.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="services" className="space-y-6">
                   <Card className="border-0 shadow-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" /> VPN & Proxy</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <FeatureSelector selectedFeature={activationType} onFeatureChange={setActivationType}>
                          <DynamicServicePicker onBuyNumber={handleBuyNumber} activationType={activationType} />
                        </FeatureSelector>
                      </CardContent>
                   </Card>

                   <Card className="border-0 shadow-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Smartphone className="h-5 w-5" /> SMS Services</CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="bg-primary/5 border-primary/10">
                          <CardHeader><CardTitle className="text-md">One-time</CardTitle></CardHeader>
                          <CardContent>
                            <div className="text-xl font-bold mb-4">$0.75</div>
                            <Button className="w-full" onClick={() => handleBuySMSNumber('verification', 'one-time')}>Get Number</Button>
                          </CardContent>
                        </Card>
                        <Card className="bg-purple-50/50 border-purple-100">
                          <CardHeader><CardTitle className="text-md">Long-term</CardTitle></CardHeader>
                          <CardContent className="space-y-2">
                             <Button variant="outline" className="w-full justify-between" onClick={() => handleBuySMSNumber('verification', 'long-term', 3)}>3 Days <span>$7.50</span></Button>
                             <Button variant="outline" className="w-full justify-between" onClick={() => handleBuySMSNumber('verification', 'long-term', 30)}>30 Days <span>$30.00</span></Button>
                          </CardContent>
                        </Card>
                      </CardContent>
                   </Card>
                </TabsContent>

                <TabsContent value="active">
                  <ActiveActivations activations={activations} onCancel={handleCancelActivation} onRefresh={loadData} />
                  {smsOrders.length > 0 && (
                    <Card className="mt-6 border-0 shadow-sm">
                      <CardHeader><CardTitle>Active SMS Orders</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        {smsOrders.filter(o => ['pending', 'active'].includes(o.status)).map(order => (
                          <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-medium">{order.service}</p>
                              <p className="text-xs text-muted-foreground">{order.mdn || 'Processing...'}</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => handleCancelSMSOrder(order.id)}>Cancel</Button>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
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
          refreshProfile?.();
          loadData();
        }} 
      />
    </div>
  );
};

export default Dashboard;