import { useEffect, useState } from 'react';
import { adminService } from '../lib/admin-service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RevenueChart } from '../components/dashboard/RevenueChart';
import { Loader2, BarChart3, TrendingUp, Users, DollarSign, Download, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { formatStatsAmount } from '../lib/currency-utils';

export function ReportsAnalytics() {
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const data = await adminService.getRevenueData(parseInt(timeRange));
      setRevenueData(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const getAnalyticsStats = () => {
    const totalRevenue = revenueData.reduce((sum, item) => sum + item.revenue, 0);
    const totalOrders = revenueData.reduce((sum, item) => sum + item.orders, 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const bestDay = revenueData.reduce((best, current) => 
      current.revenue > (best?.revenue || 0) ? current : best, null);

    return { totalRevenue, totalOrders, avgOrderValue, bestDay };
  };

  // Export functions
  const exportToCSV = async () => {
    try {
      setExportLoading(true);
      
      // Get all data for export
      const [orders, products, users] = await Promise.all([
        adminService.getAllOrders(),
        adminService.getAllProducts(),
        adminService.getAllUsers()
      ]);

      const stats = getAnalyticsStats();
      
      // Create CSV content
      const csvContent = [
        // Header
        ['Report Type', 'Analytics Report'],
        ['Generated On', new Date().toLocaleString()],
        ['Time Range', `Last ${timeRange} days`],
        [''],
        
        // Summary Stats
        ['SUMMARY STATISTICS'],
        ['Total Revenue (USD)', stats.totalRevenue.toFixed(2)],
        ['Total Orders', stats.totalOrders],
        ['Average Order Value (USD)', stats.avgOrderValue.toFixed(2)],
        ['Best Day Revenue (USD)', (stats.bestDay?.revenue || 0).toFixed(2)],
        ['Best Day Date', stats.bestDay?.date || 'N/A'],
        ['Total Products', products.length],
        ['Total Users', users.length],
        [''],
        
        // Revenue Data
        ['DAILY REVENUE DATA'],
        ['Date', 'Revenue (USD)', 'Orders', 'Average Order Value (USD)'],
        ...revenueData.map(item => [
          item.date,
          item.revenue.toFixed(2),
          item.orders,
          (item.orders > 0 ? (item.revenue / item.orders) : 0).toFixed(2)
        ])
      ];

      // Convert to CSV string
      const csvString = csvContent.map(row => 
        row.map(cell => `"${cell}"`).join(',')
      ).join('\n');

      // Download CSV
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `analytics-report-${timeRange}days-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('CSV report exported successfully');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Failed to export CSV report');
    } finally {
      setExportLoading(false);
    }
  };

  const exportToPDF = async () => {
    try {
      setExportLoading(true);
      
      // Get all data for export
      const [orders, products, users] = await Promise.all([
        adminService.getAllOrders(),
        adminService.getAllProducts(),
        adminService.getAllUsers()
      ]);

      const stats = getAnalyticsStats();
      
      // Create HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Analytics Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px; }
            .stat-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
            .stat-title { font-weight: bold; color: #666; margin-bottom: 5px; }
            .stat-value { font-size: 24px; font-weight: bold; color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .section-title { font-size: 18px; font-weight: bold; margin: 30px 0 15px 0; color: #333; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Analytics Report</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
            <p>Time Range: Last ${timeRange} days</p>
          </div>
          
          <div class="section-title">Summary Statistics</div>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-title">Total Revenue</div>
              <div class="stat-value">$${stats.totalRevenue.toFixed(2)}</div>
            </div>
            <div class="stat-card">
              <div class="stat-title">Total Orders</div>
              <div class="stat-value">${stats.totalOrders}</div>
            </div>
            <div class="stat-card">
              <div class="stat-title">Average Order Value</div>
              <div class="stat-value">$${stats.avgOrderValue.toFixed(2)}</div>
            </div>
            <div class="stat-card">
              <div class="stat-title">Best Day Revenue</div>
              <div class="stat-value">$${(stats.bestDay?.revenue || 0).toFixed(2)}</div>
              <div style="font-size: 12px; color: #666;">${stats.bestDay?.date || 'N/A'}</div>
            </div>
          </div>
          
          <div class="section-title">Daily Revenue Data</div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Revenue (USD)</th>
                <th>Orders</th>
                <th>Avg Order Value (USD)</th>
              </tr>
            </thead>
            <tbody>
              ${revenueData.map(item => `
                <tr>
                  <td>${item.date}</td>
                  <td>$${item.revenue.toFixed(2)}</td>
                  <td>${item.orders}</td>
                  <td>$${(item.orders > 0 ? (item.revenue / item.orders) : 0).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="section-title">System Overview</div>
          <table>
            <tr><td><strong>Total Products</strong></td><td>${products.length}</td></tr>
            <tr><td><strong>Total Users</strong></td><td>${users.length}</td></tr>
            <tr><td><strong>Report Generated</strong></td><td>${new Date().toLocaleString()}</td></tr>
          </table>
        </body>
        </html>
      `;

      // Create and download PDF using print functionality
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        
        // Wait for content to load then print
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      }
      
      toast.success('PDF report opened for printing/saving');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export PDF report');
    } finally {
      setExportLoading(false);
    }
  };

  const stats = getAnalyticsStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">Business insights and performance metrics</p>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex space-x-2 w-full sm:w-auto">
            <Button 
              variant="outline" 
              onClick={exportToCSV}
              disabled={exportLoading}
              className="flex-1 sm:flex-none"
            >
              {exportLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Export CSV
            </Button>
            <Button 
              variant="outline" 
              onClick={exportToPDF}
              disabled={exportLoading}
              className="flex-1 sm:flex-none"
            >
              {exportLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              Export PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Analytics Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{formatStatsAmount(stats.totalRevenue).primary}</div>
            <div className="text-xs text-muted-foreground hidden sm:block">{formatStatsAmount(stats.totalRevenue).secondary}</div>
            <p className="text-xs text-muted-foreground">
              Last {timeRange} days
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              Last {timeRange} days
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{formatStatsAmount(stats.avgOrderValue).primary}</div>
            <div className="text-xs text-muted-foreground hidden sm:block">{formatStatsAmount(stats.avgOrderValue).secondary}</div>
            <p className="text-xs text-muted-foreground">
              Per order average
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Day</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{formatStatsAmount(stats.bestDay?.revenue || 0).primary}</div>
            <div className="text-xs text-muted-foreground hidden sm:block">{formatStatsAmount(stats.bestDay?.revenue || 0).secondary}</div>
            <p className="text-xs text-muted-foreground">
              {stats.bestDay?.date || 'No data'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trends</CardTitle>
          <CardDescription>Daily revenue and order volume over time</CardDescription>
        </CardHeader>
        <CardContent>
          <RevenueChart />
        </CardContent>
      </Card>

      {/* Additional Analytics Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Products</CardTitle>
            <CardDescription>Best selling products by revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Product analytics coming soon</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer Insights</CardTitle>
            <CardDescription>User behavior and engagement metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Customer analytics coming soon</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}