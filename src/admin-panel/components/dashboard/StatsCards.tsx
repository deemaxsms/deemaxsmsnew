import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { formatStatsAmount } from '../../lib/currency-utils';
import { 
  Users, 
  DollarSign, 
  ShoppingCart, 
  Package,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { DashboardStats } from '../../lib/admin-types';

interface StatsCardsProps {
  stats: DashboardStats | null;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon: React.ReactNode;
  description?: string;
  showCurrency?: boolean;
  amount?: number;
}

function StatCard({ title, value, change, changeType, icon, description, showCurrency, amount }: StatCardProps) {
  const getTrendIcon = () => {
    switch (changeType) {
      case 'increase':
        return <TrendingUp className="h-3 w-3 text-green-600" />;
      case 'decrease':
        return <TrendingDown className="h-3 w-3 text-red-600" />;
      default:
        return <Minus className="h-3 w-3 text-gray-600" />;
    }
  };

  const getTrendColor = () => {
    switch (changeType) {
      case 'increase':
        return 'text-green-600';
      case 'decrease':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  // Format currency if needed
  const displayValue = showCurrency && typeof amount === 'number' ? formatStatsAmount(amount) : null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="text-muted-foreground">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        {displayValue ? (
          <div>
            <div className="text-2xl font-bold">{displayValue.primary}</div>
            <div className="text-sm text-muted-foreground">{displayValue.secondary}</div>
          </div>
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
        {change !== undefined && (
          <div className="flex items-center gap-1 text-xs mt-1">
            {getTrendIcon()}
            <span className={getTrendColor()}>
              {change > 0 ? '+' : ''}{change}%
            </span>
            <span className="text-muted-foreground">from last month</span>
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function StatsCards({ stats, loading, error, onRetry }: StatsCardsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-20 bg-muted animate-pulse rounded" />
              <div className="h-4 w-4 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
              <div className="h-3 w-24 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid gap-4 md:grid-cols-1">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            {onRetry && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onRetry}
                className="ml-2"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            )}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                No Data
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground">--</div>
              <p className="text-xs text-muted-foreground">
                Data unavailable
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    // Handle invalid numbers
    if (typeof amount !== 'number' || isNaN(amount)) {
      return '$0.00';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const safeNumber = (value: any) => {
    return typeof value === 'number' && !isNaN(value) ? value : 0;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Users"
        value={safeNumber(stats.totalUsers).toLocaleString()}
        change={12}
        changeType="increase"
        icon={<Users className="h-4 w-4" />}
        description={`${safeNumber(stats.activeUsers)} active users`}
      />
      
      <StatCard
        title="Total Revenue"
        value=""
        amount={safeNumber(stats.totalRevenue)}
        showCurrency={true}
        change={8}
        changeType="increase"
        icon={<DollarSign className="h-4 w-4" />}
        description="All-time revenue"
      />
      
      <StatCard
        title="Orders"
        value={(safeNumber(stats.completedOrders) + safeNumber(stats.pendingOrders)).toLocaleString()}
        change={-2}
        changeType="decrease"
        icon={<ShoppingCart className="h-4 w-4" />}
        description={`${safeNumber(stats.pendingOrders)} pending`}
      />
      
      <StatCard
        title="Products"
        value={safeNumber(stats.totalProducts).toLocaleString()}
        change={5}
        changeType="increase"
        icon={<Package className="h-4 w-4" />}
        description={`${safeNumber(stats.activeProducts)} active`}
      />
    </div>
  );
}