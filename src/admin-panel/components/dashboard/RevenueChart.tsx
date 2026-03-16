import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { adminService } from '../../lib/admin-service';
import { RevenueData } from '../../lib/admin-types';
import { formatStatsAmount } from '../../lib/currency-utils';
import { Loader2, RefreshCw, AlertCircle, TrendingUp } from 'lucide-react';

type ChartType = 'line' | 'bar';
type TimePeriod = '7' | '30' | '90';

export function RevenueChart() {
  const [data, setData] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartType, setChartType] = useState<ChartType>('line');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('30');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    loadRevenueData();
  }, [timePeriod]);

  const loadRevenueData = async (isRetry = false) => {
    try {
      setLoading(true);
      setError(null);
      
      if (isRetry) {
        setRetryCount(prev => prev + 1);
      }

      const revenueData = await adminService.getRevenueData(parseInt(timePeriod));
      
      // Validate data structure
      if (!Array.isArray(revenueData)) {
        throw new Error('Invalid data format received from server');
      }

      // Sort data by date to ensure proper chart display
      const sortedData = revenueData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      setData(sortedData);
      setRetryCount(0); // Reset retry count on success
    } catch (error: any) {
      console.error('Error loading revenue data:', error);
      
      // Set user-friendly error messages
      if (error.message?.includes('network') || error.message?.includes('fetch')) {
        setError('Network error. Please check your connection and try again.');
      } else if (error.message?.includes('permission') || error.message?.includes('unauthorized')) {
        setError('You don\'t have permission to view this data.');
      } else if (error.message?.includes('Invalid data format')) {
        setError('Data format error. Please contact support if this persists.');
      } else {
        setError('Failed to load revenue data. Please try again.');
      }
      
      // Set empty data on error
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    loadRevenueData(true);
  };

  const formatCurrency = (value: number) => {
    // Handle invalid numbers
    if (typeof value !== 'number' || isNaN(value)) {
      return '$0.00';
    }
    
    const currency = formatStatsAmount(value);
    return currency.primary; // Show USD as primary
  };

  const formatCurrencyTooltip = (value: number) => {
    if (typeof value !== 'number' || isNaN(value)) {
      return '$0.00 (₦0)';
    }
    
    const usd = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
    
    const ngn = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value * 1650); // USD to NGN conversion
    
    return `${usd} (${ngn})`;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString; // Return original if invalid
      }
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const revenueValue = payload[0]?.value || 0;
      const ordersValue = payload[1]?.value || payload.find((p: any) => p.dataKey === 'orders')?.value || 0;
      
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-medium">{formatDate(label)}</p>
          <p className="text-blue-600">
            Revenue: {formatCurrencyTooltip(revenueValue)}
          </p>
          <p className="text-green-600">
            Orders: {ordersValue}
          </p>
        </div>
      );
    }
    return null;
  };

  // Safe calculations with error handling
  const totalRevenue = data.reduce((sum, item) => {
    const revenue = typeof item.revenue === 'number' ? item.revenue : 0;
    return sum + revenue;
  }, 0);
  
  const totalOrders = data.reduce((sum, item) => {
    const orders = typeof item.orders === 'number' ? item.orders : 0;
    return sum + orders;
  }, 0);
  
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Loading state
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5" />
            Revenue Overview
          </CardTitle>
          <CardDescription>Revenue and orders over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-80">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-muted-foreground">Loading revenue data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5" />
            Revenue Overview
          </CardTitle>
          <CardDescription>Revenue and orders over time</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRetry}
                disabled={loading}
                className="ml-2"
              >
                {loading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
                Retry
              </Button>
            </AlertDescription>
          </Alert>
          
          {retryCount > 0 && (
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Retry attempt: {retryCount}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              Revenue Overview
            </CardTitle>
            <CardDescription>Revenue and orders over time</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Select value={timePeriod} onValueChange={(value: TimePeriod) => setTimePeriod(value)}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7d</SelectItem>
                <SelectItem value="30">30d</SelectItem>
                <SelectItem value="90">90d</SelectItem>
              </SelectContent>
            </Select>
            <Select value={chartType} onValueChange={(value: ChartType) => setChartType(value)}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="line">Line</SelectItem>
                <SelectItem value="bar">Bar</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => loadRevenueData(true)}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {formatStatsAmount(totalRevenue).primary}
            </div>
            <div className="text-sm text-muted-foreground">
              {formatStatsAmount(totalRevenue).secondary}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total Revenue</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {totalOrders.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">Total Orders</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {formatStatsAmount(averageOrderValue).primary}
            </div>
            <div className="text-sm text-muted-foreground">
              {formatStatsAmount(averageOrderValue).secondary}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Avg Order Value</p>
          </div>
        </div>

        {/* Chart */}
        <div className="h-80">
          {data.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">No revenue data available</p>
                <p className="text-sm text-muted-foreground">
                  No transactions found for the selected {timePeriod}-day period
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRetry}
                  className="mt-4"
                >
                  <RefreshCw className="h-3 w-3 mr-2" />
                  Refresh Data
                </Button>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'line' ? (
                <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate}
                    className="text-muted-foreground"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    tickFormatter={formatCurrency}
                    className="text-muted-foreground"
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                    connectNulls={false}
                  />
                </LineChart>
              ) : (
                <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate}
                    className="text-muted-foreground"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    tickFormatter={formatCurrency}
                    className="text-muted-foreground"
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="revenue" 
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          )}
        </div>
        
        {data.length > 0 && (
          <div className="mt-4 text-center text-xs text-muted-foreground">
            Showing data for the last {timePeriod} days • {data.length} data points
          </div>
        )}
      </CardContent>
    </Card>
  );
}