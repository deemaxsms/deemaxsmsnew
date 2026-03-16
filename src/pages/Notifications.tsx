import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Bell, BellRing, Check, Package, Loader2 } from 'lucide-react';
import { userNotificationService, UserNotification } from '@/lib/user-notification-service';
import { useAuth } from '@/lib/auth-context';

// Helper function to format time ago
const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString();
};

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/login");
      } else {
        // Subscribe to notifications
        const unsubscribe = userNotificationService.subscribeToUserNotifications(
          user.uid,
          (newNotifications) => {
            setNotifications(newNotifications);
            setLoading(false);
          }
        );

        // Set a timeout to stop loading even if no notifications come
        const timeout = setTimeout(() => {
          setLoading(false);
        }, 3000);

        return () => {
          unsubscribe();
          clearTimeout(timeout);
        };
      }
    }
  }, [user, authLoading, navigate]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleNotificationClick = async (notification: UserNotification) => {
    // Mark as read
    if (!notification.isRead) {
      await userNotificationService.markAsRead(notification.id);
    }

    // Handle navigation based on notification type
    if (notification.data?.action === 'view_order' && notification.orderId) {
      navigate('/orders');
    } else if (notification.data?.action === 'accept_refund') {
      // Handle refund acceptance
      await handleRefundAcceptance(notification);
    }
  };

  const handleRefundAcceptance = async (notification: UserNotification) => {
    if (!user || !notification.data?.refundAmount) return;
    
    try {
      const result = await userNotificationService.acceptRefund(
        user.uid,
        notification.orderId!,
        notification.data.refundAmount
      );
      
      if (result.success) {
        // Show success message and navigate to orders
        navigate('/orders');
      } else {
        console.error('Failed to accept refund:', result.error);
      }
    } catch (error) {
      console.error('Error accepting refund:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    await userNotificationService.markAllAsRead(user.uid);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order_placed': return '📦';
      case 'order_completed': return '🎉';
      case 'order_processing': return '⏳';
      case 'payment_confirmed': return '💰';
      case 'refund_available': return '💸';
      default: return '📢';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'order_placed': return 'bg-blue-50 border-blue-200';
      case 'order_completed': return 'bg-green-50 border-green-200';
      case 'order_processing': return 'bg-yellow-50 border-yellow-200';
      case 'payment_confirmed': return 'bg-purple-50 border-purple-200';
      case 'refund_available': return 'bg-orange-50 border-orange-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getTimeAgo = (date: Date) => {
    try {
      return formatTimeAgo(date);
    } catch (error) {
      return 'Recently';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 container px-3 sm:px-4 py-4 sm:py-8">
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 flex items-center gap-3">
                {unreadCount > 0 ? (
                  <BellRing className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                ) : (
                  <Bell className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                )}
                Notifications
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>
                )}
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
              </p>
            </div>
            
            {unreadCount > 0 && (
              <Button onClick={markAllAsRead} variant="outline" className="w-full sm:w-auto">
                <Check className="h-4 w-4 mr-2" />
                Mark All as Read
              </Button>
            )}
          </div>

          {/* Notifications List */}
          <div className="space-y-3">
            {notifications.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="py-12 text-center px-4">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="p-4 bg-gray-50 rounded-full">
                      <Bell className="h-12 w-12 text-gray-400" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-semibold text-base sm:text-lg">No notifications yet</h3>
                      <p className="text-sm text-muted-foreground max-w-sm">
                        Order updates and important messages will appear here
                      </p>
                    </div>
                    <Button onClick={() => navigate("/marketplace")} className="mt-4">
                      Browse Services
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              notifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    !notification.isRead ? getNotificationColor(notification.type) : 'bg-white'
                  } ${!notification.isRead ? 'border-l-4 border-l-blue-500' : ''}`}
                  onClick={() => notification.data?.action !== 'accept_refund' ? handleNotificationClick(notification) : undefined}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl mt-1 flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className={`font-semibold text-sm sm:text-base ${!notification.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                            {notification.title}
                          </h3>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full" />
                            )}
                            <span className="text-xs text-gray-400">
                              {getTimeAgo(notification.createdAt)}
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          {notification.orderNumber && (
                            <Badge variant="outline" className="text-xs">
                              Order #{notification.orderNumber.slice(-8)}
                            </Badge>
                          )}
                          
                          {notification.data?.action === 'view_order' && (
                            <Button variant="ghost" size="sm" className="text-xs h-7 px-2">
                              View Order →
                            </Button>
                          )}
                        </div>
                        
                        {notification.data?.action === 'accept_refund' && (
                          <div className="mt-4 pt-3 border-t">
                            <Button 
                              className="w-full bg-green-600 hover:bg-green-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRefundAcceptance(notification);
                              }}
                            >
                              Accept Refund ${notification.data.refundAmount?.toFixed(2)}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Quick Actions */}
          {notifications.length > 0 && (
            <Card className="border-0 shadow-sm bg-blue-50">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-sm sm:text-base text-blue-900">Stay Updated</h3>
                    <p className="text-xs sm:text-sm text-blue-700">
                      Get notified about order updates, new services, and important announcements
                    </p>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" size="sm" onClick={() => navigate("/orders")} className="flex-1 sm:flex-none">
                      <Package className="h-4 w-4 mr-2" />
                      My Orders
                    </Button>
                    <Button size="sm" onClick={() => navigate("/marketplace")} className="flex-1 sm:flex-none">
                      Browse Services
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}