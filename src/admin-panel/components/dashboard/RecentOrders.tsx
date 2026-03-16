import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Eye, MoreHorizontal, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { adminService } from '../../lib/admin-service';
import { ProductOrder } from '@/lib/firestore-service';
import { formatStatsAmount } from '../../lib/currency-utils';

interface RecentOrdersProps {
  limit?: number;
}

export function RecentOrders({ limit = 5 }: RecentOrdersProps) {
  const [orders, setOrders] = useState<ProductOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<ProductOrder | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  useEffect(() => {
    loadRecentOrders();
  }, []);

  const loadRecentOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const allOrders = await adminService.getAllOrders(limit);
      
      // Sort by creation date and take the most recent
      const recentOrders = allOrders
        .sort((a, b) => {
          // Safe date comparison
          const dateA = a.createdAt ? (a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt)) : new Date(0);
          const dateB = b.createdAt ? (b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt)) : new Date(0);
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, limit);
      setOrders(recentOrders);
    } catch (error: any) {
      console.error('Error loading recent orders:', error);
      setError(error.message || 'Failed to load recent orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'secondary' as const, label: 'Pending' },
      processing: { variant: 'default' as const, label: 'Processing' },
      shipped: { variant: 'outline' as const, label: 'Shipped' },
      delivered: { variant: 'default' as const, label: 'Delivered' },
      completed: { variant: 'default' as const, label: 'Completed' },
      cancelled: { variant: 'destructive' as const, label: 'Cancelled' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleViewDetails = (order: ProductOrder) => {
    setSelectedOrder(order);
    setDetailsDialogOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: Date | string | any) => {
    try {
      let dateObj: Date;
      
      if (!date) {
        return 'Unknown';
      }
      
      // Handle Firestore Timestamp
      if (date.toDate && typeof date.toDate === 'function') {
        dateObj = date.toDate();
      } else if (typeof date === 'string') {
        dateObj = new Date(date);
      } else if (date instanceof Date) {
        dateObj = date;
      } else {
        return 'Unknown';
      }
      
      // Check if date is valid
      if (isNaN(dateObj.getTime())) {
        return 'Unknown';
      }
      
      return dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unknown';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>Latest customer orders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-muted animate-pulse rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                </div>
                <div className="h-6 w-16 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>Latest customer orders</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error.includes('permissions') 
                ? 'Admin permissions are being set up. This feature will be available shortly.'
                : error
              }
            </AlertDescription>
          </Alert>
          <Button 
            variant="outline" 
            onClick={loadRecentOrders} 
            className="mt-4 w-full"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Orders</CardTitle>
        <CardDescription>Latest customer orders</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No recent orders found
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="flex items-center justify-between space-x-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {order.userEmail?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {order.userEmail || 'Unknown Customer'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Order #{order.id?.slice(-8) || 'Unknown'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {formatStatsAmount(order.amount || order.price || 0).primary}
                    </p>
                    {getStatusBadge(order.status || 'pending')}
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewDetails(order)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))
          )}
        </div>
        
        {orders.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <Button variant="outline" className="w-full">
              View All Orders
            </Button>
          </div>
        )}
      </CardContent>

      {/* Order Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              Complete information about this order
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Order ID</h4>
                  <p className="font-mono text-sm">{selectedOrder.id}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Status</h4>
                  {getStatusBadge(selectedOrder.status || 'pending')}
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Customer</h4>
                  <p className="text-sm">{selectedOrder.userEmail || 'Unknown'}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Amount</h4>
                  <p className="text-sm font-medium">{formatStatsAmount(selectedOrder.amount || selectedOrder.price || 0).primary}</p>
                  <p className="text-xs text-muted-foreground">{formatStatsAmount(selectedOrder.amount || selectedOrder.price || 0).secondary}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Product</h4>
                  <p className="text-sm">{selectedOrder.productName || 'Unknown Product'}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Order Date</h4>
                  <p className="text-sm">{formatDate(selectedOrder.createdAt)}</p>
                </div>
              </div>
              
              {(selectedOrder as any).productDetails && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Product Details</h4>
                  <div className="bg-muted p-3 rounded-lg">
                    <pre className="text-xs whitespace-pre-wrap">{JSON.stringify((selectedOrder as any).productDetails, null, 2)}</pre>
                  </div>
                </div>
              )}
              
              {selectedOrder.adminNotes && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Admin Notes</h4>
                  <p className="text-sm bg-blue-50 p-2 rounded border-l-4 border-blue-400">{selectedOrder.adminNotes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}