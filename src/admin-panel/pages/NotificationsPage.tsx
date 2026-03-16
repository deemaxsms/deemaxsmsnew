import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, BellRing, Settings, Check, ArrowLeft } from 'lucide-react';
import { notificationService } from '../lib/notification-service';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface NotificationItem {
  id: string;
  type: 'order' | 'gift' | 'user' | 'payment';
  title: string;
  message: string;
  time: Date;
  isRead: boolean;
  data?: any;
}

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const navigate = useNavigate();

  useEffect(() => {
    // Check initial permission status
    setPermissionStatus(notificationService.getPermissionStatus());

    // Subscribe to real-time updates
    const unsubscribeOrders = notificationService.subscribeToNewOrders((orders) => {
      const orderNotifications: NotificationItem[] = orders.slice(0, 10).map(order => ({
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
        return [...orderNotifications, ...filtered].slice(0, 50);
      });
    });

    const unsubscribeGifts = notificationService.subscribeToGiftRequests((requests) => {
      const giftNotifications: NotificationItem[] = requests
        .filter(request => !request.adminResponse || request.adminResponse.status === 'pending')
        .slice(0, 10)
        .map(request => ({
          id: `gift-${request.id}`,
          type: 'gift',
          title: 'Custom Gift Request',
          message: `From ${request.senderName} - Budget: ${request.customRequestDetails?.budget || 0}`,
          time: request.createdAt,
          isRead: false,
          data: request
        }));

      setNotifications(prev => {
        const filtered = prev.filter(n => n.type !== 'gift');
        return [...giftNotifications, ...filtered].slice(0, 50);
      });
    });

    const unsubscribeUsers = notificationService.subscribeToNewUsers((users) => {
      const userNotifications: NotificationItem[] = users.slice(0, 5).map(user => ({
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
        return [...userNotifications, ...filtered].slice(0, 50);
      });
    });

    const unsubscribeTransactions = notificationService.subscribeToTransactions((transactions) => {
      const paymentNotifications: NotificationItem[] = transactions.slice(0, 5).map(transaction => ({
        id: `payment-${transaction.id}`,
        type: 'payment',
        title: 'Payment Received',
        message: `${transaction.amount} from ${transaction.userEmail || 'User'}`,
        time: transaction.createdAt,
        isRead: false,
        data: transaction
      }));

      setNotifications(prev => {
        const filtered = prev.filter(n => n.type !== 'payment');
        return [...paymentNotifications, ...filtered].slice(0, 50);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="md:hidden"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <Check className="h-4 w-4 mr-2" />
              Mark all read
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleRequestPermission}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Permission Status */}
      {permissionStatus !== 'granted' && (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-yellow-800 mb-1">Enable Browser Notifications</h3>
                <p className="text-sm text-yellow-600">Get instant alerts for new orders and requests</p>
              </div>
              <Button onClick={handleRequestPermission}>
                Enable Notifications
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {unreadCount > 0 ? (
              <BellRing className="h-5 w-5" />
            ) : (
              <Bell className="h-5 w-5" />
            )}
            Recent Activity
          </CardTitle>
          <CardDescription>
            Stay updated with the latest orders, requests, and system events
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {notifications.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Bell className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No notifications yet</h3>
              <p className="text-sm">New orders and requests will appear here</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="divide-y">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.isRead ? getNotificationColor(notification.type) : ''
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-2xl mt-1 flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className={`font-medium text-sm ${!notification.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                            {notification.title}
                          </h4>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-400">
                            {formatDistanceToNow(notification.time, { addSuffix: true })}
                          </p>
                          <Badge variant="secondary" className="text-xs">
                            {notification.type.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}