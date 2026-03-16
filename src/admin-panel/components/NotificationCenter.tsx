import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, BellRing, Settings, Check, X } from 'lucide-react';
import { notificationService } from '../lib/notification-service';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface NotificationItem {
  id: string;
  type: 'order' | 'gift' | 'user' | 'payment';
  title: string;
  message: string;
  time: Date;
  isRead: boolean;
  data?: any;
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');

  useEffect(() => {
    // Check initial permission status
    setPermissionStatus(notificationService.getPermissionStatus());

    // Subscribe to real-time updates
    const unsubscribeOrders = notificationService.subscribeToNewOrders((orders) => {
      const orderNotifications: NotificationItem[] = orders.slice(0, 5).map(order => ({
        id: `order-${order.id}`,
        type: 'order',
        title: 'New Order',
        message: `Order #${order.orderNumber || order.id.substring(0, 8)} - ${order.productName || 'Product'}`,
        time: order.createdAt,
        isRead: false,
        data: order
      }));

      setNotifications(prev => {
        const filtered = prev.filter(n => n.type !== 'order');
        return [...orderNotifications, ...filtered].slice(0, 20);
      });
    });

    const unsubscribeGifts = notificationService.subscribeToGiftRequests((requests) => {
      const giftNotifications: NotificationItem[] = requests
        .filter(request => !request.adminResponse || request.adminResponse.status === 'pending')
        .slice(0, 5)
        .map(request => ({
          id: `gift-${request.id}`,
          type: 'gift',
          title: 'Custom Gift Request',
          message: `From ${request.senderName} - Budget: $${request.customRequestDetails?.budget || 0}`,
          time: request.createdAt,
          isRead: false,
          data: request
        }));

      setNotifications(prev => {
        const filtered = prev.filter(n => n.type !== 'gift');
        return [...giftNotifications, ...filtered].slice(0, 20);
      });
    });

    const unsubscribeUsers = notificationService.subscribeToNewUsers((users) => {
      const userNotifications: NotificationItem[] = users.slice(0, 3).map(user => ({
        id: `user-${user.id}`,
        type: 'user',
        title: 'New User Signup',
        message: `${user.email || user.displayName || 'New user'} joined`,
        time: user.createdAt,
        isRead: false,
        data: user
      }));

      setNotifications(prev => {
        const filtered = prev.filter(n => n.type !== 'user');
        return [...userNotifications, ...filtered].slice(0, 20);
      });
    });

    const unsubscribeTransactions = notificationService.subscribeToTransactions((transactions) => {
      const paymentNotifications: NotificationItem[] = transactions.slice(0, 3).map(transaction => ({
        id: `payment-${transaction.id}`,
        type: 'payment',
        title: 'Payment Received',
        message: `$${transaction.amount} from ${transaction.userEmail || 'User'}`,
        time: transaction.createdAt,
        isRead: false,
        data: transaction
      }));

      setNotifications(prev => {
        const filtered = prev.filter(n => n.type !== 'payment');
        return [...paymentNotifications, ...filtered].slice(0, 20);
      });
    });

    return () => {
      unsubscribeOrders();
      unsubscribeGifts();
      unsubscribeUsers();
      unsubscribeTransactions();
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleRequestPermission = async () => {
    const granted = await notificationService.requestNotificationPermission();
    setPermissionStatus(granted ? 'granted' : 'denied');
    
    if (granted) {
      toast.success('Notifications enabled! You\'ll receive alerts for new orders and requests.');
    } else {
      toast.error('Notifications denied. You can enable them in your browser settings.');
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order': return '🛒';
      case 'gift': return '🎁';
      case 'user': return '👤';
      case 'payment': return '💰';
      default: return '📢';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'order': return 'bg-blue-50 border-blue-200';
      case 'gift': return 'bg-purple-50 border-purple-200';
      case 'user': return 'bg-green-50 border-green-200';
      case 'payment': return 'bg-yellow-50 border-yellow-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

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
                <Button variant="ghost" size="sm" onClick={handleRequestPermission}>
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            {/* Permission Status */}
            {permissionStatus !== 'granted' && (
              <div className="px-4 py-3 bg-yellow-50 border-b">
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800">Enable Browser Notifications</p>
                    <p className="text-yellow-600">Get instant alerts for new orders and requests</p>
                  </div>
                  <Button size="sm" onClick={handleRequestPermission}>
                    Enable
                  </Button>
                </div>
              </div>
            )}

            {/* Notifications List */}
            <ScrollArea className="h-96">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No notifications yet</p>
                  <p className="text-sm">New orders and requests will appear here</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                        !notification.isRead ? getNotificationColor(notification.type) : ''
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-lg">
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
                          <p className="text-xs text-gray-400 mt-2">
                            {formatDistanceToNow(notification.time, { addSuffix: true })}
                          </p>
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