import { useEffect, useState } from 'react';
import { adminService } from '../lib/admin-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, DollarSign, TrendingUp, TrendingDown, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { formatStatsAmount } from '../lib/currency-utils';

export function TransactionsManagement() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const transactionsData = await adminService.getAllTransactions();
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(transaction =>
    transaction.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTransactionStats = () => {
    const totalTransactions = transactions.length;
    const totalRevenue = transactions
      .filter(t => t.type === 'purchase')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalTopUps = transactions
      .filter(t => t.type === 'top_up')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    const avgTransaction = totalRevenue / (transactions.filter(t => t.type === 'purchase').length || 1);

    return { totalTransactions, totalRevenue, totalTopUps, avgTransaction };
  };

  const getTransactionBadge = (type: string) => {
    switch (type) {
      case 'purchase':
        return <Badge variant="destructive"><TrendingDown className="h-3 w-3 mr-1" />Purchase</Badge>;
      case 'top_up':
        return <Badge variant="default"><TrendingUp className="h-3 w-3 mr-1" />Top Up</Badge>;
      case 'refund':
        return <Badge variant="secondary"><CreditCard className="h-3 w-3 mr-1" />Refund</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const stats = getTransactionStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Transactions Management</h1>
          <p className="text-muted-foreground">Monitor all financial transactions</p>
        </div>
        <Button onClick={loadTransactions} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTransactions}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatStatsAmount(stats.totalRevenue).primary}</div>
            <div className="text-xs text-muted-foreground">{formatStatsAmount(stats.totalRevenue).secondary}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Top-ups</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatStatsAmount(stats.totalTopUps).primary}</div>
            <div className="text-xs text-muted-foreground">{formatStatsAmount(stats.totalTopUps).secondary}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Transaction</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatStatsAmount(stats.avgTransaction).primary}</div>
            <div className="text-xs text-muted-foreground">{formatStatsAmount(stats.avgTransaction).secondary}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Search</CardTitle>
          <CardDescription>Search transactions by user, type, or description</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions by ID, email, amount..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions ({filteredTransactions.length})</CardTitle>
          <CardDescription>All financial transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <div className="font-mono text-sm">{transaction.id.substring(0, 8)}...</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{transaction.userId}</div>
                    </TableCell>
                    <TableCell>
                      {getTransactionBadge(transaction.type)}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{formatStatsAmount(transaction.amount || 0).primary}</div>
                      <div className="text-xs text-muted-foreground">{formatStatsAmount(transaction.amount || 0).secondary}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{transaction.description || 'No description'}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString() : 'Unknown'}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}