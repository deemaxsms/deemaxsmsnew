import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, BellRing, Check } from 'lucide-react';
import { userNotificationService, UserNotification } from '@/lib/user-notification-service';
import { useAuth } from '@/lib/auth-context';
import { useNavigate } from 'react-router-dom';

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

export function UserNotifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = userNotificationService.subscribeToUserNotifications(
      user.uid,
      (newNotifications) => {
        setNotifications(newNotifications);
      }
    );

    return unsubscribe;
  }, [user]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleNotificationClick = async (notification: UserNotification) => {
    // Mark as read
    if (!notification.isRead) {
      await userNotificationService.markAsRead(notification.id);
    }

    // Handle navigation based on notification type
    if (notification.data?.action === 'view_order' && notification.orderId) {
      navigate('/orders');
      setIsOpen(false);
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
        setIsOpen(false);
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

  if (!user) return null;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          {unreadCount > 0 ? (
            <BellRing className="h-5 w-5" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-96 p-0" align="end">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Notifications</CardTitle>
                <CardDescription>
                  {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                    <Check className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <ScrollArea className="h-96">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No notifications yet</p>
                  <p className="text-sm">Order updates will appear here</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                        !notification.isRead ? getNotificationColor(notification.type) : ''
                      }`}
                      onClick={() => notification.data?.action !== 'accept_refund' ? handleNotificationClick(notification) : undefined}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-lg mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={`text-sm font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                              {notification.title}
                            </p>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-gray-400">
                              {formatTimeAgo(notification.createdAt)}
                            </p>
                            {notification.orderNumber && (
                              <Badge variant="outline" className="text-xs">
                                #{notification.orderNumber.slice(-8)}
                              </Badge>
                            )}
                          </div>
                          {notification.data?.action === 'accept_refund' && (
                            <div className="mt-3 pt-2 border-t">
                              <Button 
                                size="sm" 
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
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}