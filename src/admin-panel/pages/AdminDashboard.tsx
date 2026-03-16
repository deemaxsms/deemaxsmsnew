import { useEffect, useState } from 'react';
import { StatsCards } from '../components/dashboard/StatsCards';
import { RecentOrders } from '../components/dashboard/RecentOrders';
import { RevenueChart } from '../components/dashboard/RevenueChart';
import { ErrorBoundary, SimpleErrorFallback } from '../components/ErrorBoundary';
import { adminService } from '../lib/admin-service';
import { DashboardStats } from '../lib/admin-types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, BarChart3 } from 'lucide-react';

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async (isRetry = false) => {
    try {
      setLoading(true);
      setError(null);
      
      if (isRetry) {
        setRetryCount(prev => prev + 1);
      }

      const dashboardStats = await adminService.getDashboardStats();
      setStats(dashboardStats);
      setRetryCount(0); // Reset on success
    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      
      // Set user-friendly error messages
      if (error.message?.includes('permission') || error.message?.includes('unauthorized')) {
        setError('Admin permissions are being set up. Please try again in a moment.');
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError('Failed to load dashboard data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    loadDashboardData(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <BarChart3 className="mr-3 h-8 w-8" />
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">
            Overview of your platform's performance and key metrics
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleRetry}
          disabled={loading}
        >
          {loading ? (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Refresh
        </Button>
      </div>

      {/* Global Error Alert */}
      {error && !loading && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRetry}
              className="ml-2"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {retryCount > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          Retry attempt: {retryCount}
        </div>
      )}

      {/* Stats Cards */}
      <ErrorBoundary fallback={SimpleErrorFallback}>
        <StatsCards 
          stats={stats} 
          loading={loading} 
          error={error}
          onRetry={handleRetry}
        />
      </ErrorBoundary>

      {/* Charts and Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          <ErrorBoundary fallback={SimpleErrorFallback}>
            <RevenueChart />
          </ErrorBoundary>
        </div>
        <div className="col-span-3">
          <ErrorBoundary fallback={SimpleErrorFallback}>
            <RecentOrders limit={5} />
          </ErrorBoundary>
        </div>
      </div>

      {/* Additional Dashboard Info */}
      {stats && !loading && !error && (
        <div className="text-center text-sm text-muted-foreground">
          Dashboard last updated: {new Date().toLocaleString()}
        </div>
      )}
    </div>
  );
}