import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth-context";
import { firestoreService, BalanceTransaction } from "@/lib/firestore-service";
import { formatCurrency } from "@/lib/currency";
import { 
  Loader2, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  History, 
  Wallet,
  Gift,
  ShoppingCart,
  RotateCcw,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react";
import { format } from "date-fns";

const Transactions = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<BalanceTransaction[]>([]);

  const [activeTab, setActiveTab] = useState("all");

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
      const txData = await firestoreService.getUserTransactions(user.uid).catch(err => {
        console.warn("Failed to load transactions:", err);
        return [];
      });
      setTransactions(txData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <Wallet className="h-4 w-4 md:h-5 md:w-5" />;
      case 'referral_bonus':
        return <Gift className="h-4 w-4 md:h-5 md:w-5" />;
      case 'purchase':
        return <ShoppingCart className="h-4 w-4 md:h-5 md:w-5" />;
      case 'refund':
        return <RotateCcw className="h-4 w-4 md:h-5 md:w-5" />;
      default:
        return <ArrowUpCircle className="h-4 w-4 md:h-5 md:w-5" />;
    }
  };

  const getTransactionColor = (type: string) => {
    if (type === 'deposit' || type === 'referral_bonus' || type === 'refund') {
      return 'bg-success/10 text-success';
    }
    return 'bg-destructive/10 text-destructive';
  };

  const isPositiveTransaction = (type: string) => {
    return type === 'deposit' || type === 'referral_bonus' || type === 'refund';
  };



  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Calculate summary stats
  const totalDeposits = transactions
    .filter(t => t.type === 'deposit')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalSpent = transactions
    .filter(t => t.type === 'purchase' || t.type === 'withdrawal')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalReferralEarnings = transactions
    .filter(t => t.type === 'referral_bonus')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container px-4 py-6 md:py-8">
        <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Transaction History</h1>
            <p className="text-muted-foreground">
              View all your balance transactions and deposits
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-success/10">
                    <ArrowDownCircle className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Deposits</p>
                    <p className="text-lg md:text-xl font-bold">{formatCurrency(totalDeposits, 'USD')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-destructive/10">
                    <ArrowUpCircle className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Spent</p>
                    <p className="text-lg md:text-xl font-bold">{formatCurrency(totalSpent, 'USD')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Gift className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Referral Earnings</p>
                    <p className="text-lg md:text-xl font-bold">{formatCurrency(totalReferralEarnings, 'USD')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transactions */}
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="all" className="text-xs sm:text-sm">All ({transactions.length})</TabsTrigger>
              <TabsTrigger value="deposits" className="text-xs sm:text-sm">Deposits ({transactions.filter(t => t.type === 'deposit').length})</TabsTrigger>
              <TabsTrigger value="purchases" className="text-xs sm:text-sm">Purchases</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <History className="h-5 w-5" />
                    All Transactions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {transactions.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="font-medium">No transactions yet</p>
                      <p className="text-sm">Your transaction history will appear here</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => navigate("/dashboard")}
                      >
                        Go to Dashboard
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2 md:space-y-3">
                      {transactions.map((transaction) => (
                        <div
                          key={transaction.id}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-3 md:p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3 md:gap-4 flex-1">
                            <div className={`p-2 rounded-full shrink-0 ${getTransactionColor(transaction.type)}`}>
                              {getTransactionIcon(transaction.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm md:text-base truncate">{transaction.description}</p>
                              <p className="text-xs md:text-sm text-muted-foreground">
                                {transaction.createdAt?.toDate 
                                  ? format(transaction.createdAt.toDate(), "MMM dd, yyyy 'at' h:mm a")
                                  : 'Date unavailable'
                                }
                              </p>
                            </div>
                          </div>
                          <div className="text-left sm:text-right shrink-0">
                            <p className={`font-bold text-base md:text-lg ${
                              isPositiveTransaction(transaction.type) ? 'text-success' : 'text-destructive'
                            }`}>
                              {isPositiveTransaction(transaction.type) ? '+' : '-'}
                              {formatCurrency(Number(transaction.amount), 'USD')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Balance: {formatCurrency(Number(transaction.balanceAfter), 'USD')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="deposits" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Wallet className="h-5 w-5" />
                    Deposit History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {transactions.filter(t => t.type === 'deposit').length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="font-medium">No deposits yet</p>
                      <p className="text-sm">Add funds to get started</p>
                    </div>
                  ) : (
                    <div className="space-y-2 md:space-y-3">
                      {transactions.filter(t => t.type === 'deposit').map((transaction) => (
                        <div
                          key={transaction.id}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-3 md:p-4 rounded-lg border bg-card"
                        >
                          <div className="flex items-center gap-3 md:gap-4 flex-1">
                            <div className={`p-2 rounded-full shrink-0 ${getTransactionColor(transaction.type)}`}>
                              {getTransactionIcon(transaction.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm md:text-base">
                                  {transaction.description}
                                </p>
                              </div>
                              <p className="text-xs md:text-sm text-muted-foreground">
                                {transaction.createdAt?.toDate 
                                  ? format(transaction.createdAt.toDate(), "MMM dd, yyyy 'at' h:mm a")
                                  : 'Date unavailable'
                                }
                              </p>
                              {transaction.txRef && (
                                <p className="text-xs text-muted-foreground truncate">
                                  Ref: {transaction.txRef}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-left sm:text-right shrink-0">
                            <p className="font-bold text-base md:text-lg text-success">
                              +{formatCurrency(transaction.amount, 'USD')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Balance: {formatCurrency(transaction.balanceAfter, 'USD')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="purchases" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ShoppingCart className="h-5 w-5" />
                    Purchase History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {transactions.filter(t => t.type === 'purchase').length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="font-medium">No purchases yet</p>
                      <p className="text-sm">Buy virtual numbers to see them here</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => navigate("/dashboard")}
                      >
                        Buy Numbers
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2 md:space-y-3">
                      {transactions
                        .filter(t => t.type === 'purchase')
                        .map((transaction) => (
                          <div
                            key={transaction.id}
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-3 md:p-4 rounded-lg border bg-card"
                          >
                            <div className="flex items-center gap-3 md:gap-4 flex-1">
                              <div className="p-2 rounded-full shrink-0 bg-destructive/10 text-destructive">
                                <ShoppingCart className="h-4 w-4 md:h-5 md:w-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm md:text-base truncate">{transaction.description}</p>
                                <p className="text-xs md:text-sm text-muted-foreground">
                                  {transaction.createdAt?.toDate 
                                    ? format(transaction.createdAt.toDate(), "MMM dd, yyyy 'at' h:mm a")
                                    : 'Date unavailable'
                                  }
                                </p>
                              </div>
                            </div>
                            <div className="text-left sm:text-right shrink-0">
                              <p className="font-bold text-base md:text-lg text-destructive">
                                -{formatCurrency(Number(transaction.amount), 'USD')}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Transactions;
