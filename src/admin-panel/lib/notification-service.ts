// Real-time notification service for admin panel
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  limit,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface AdminNotification {
  id: string;
  type: 'new_order' | 'new_gift_request' | 'payment_received' | 'user_signup' | 'system_alert';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: Date;
  userId?: string;
  orderNumber?: string;
}

class NotificationService {
  private listeners: Map<string, () => void> = new Map();
  private notificationPermission: NotificationPermission = 'default';

  constructor() {
    this.requestNotificationPermission();
  }

  // Request browser notification permission
  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      this.notificationPermission = 'granted';
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      this.notificationPermission = permission;
      return permission === 'granted';
    }

    return false;
  }

  // Show browser notification
  showBrowserNotification(title: string, options?: NotificationOptions) {
    if (this.notificationPermission === 'granted') {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options
      });

      // Auto close after 5 seconds
      setTimeout(() => notification.close(), 5000);

      return notification;
    }
    return null;
  }

  // Listen for new orders
  subscribeToNewOrders(callback: (orders: any[]) => void): () => void {
    const q = query(
      collection(db, 'product_orders'),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }));

      // Check for new orders (created in last 30 seconds)
      const now = new Date();
      const thirtySecondsAgo = new Date(now.getTime() - 30000);
      
      const newOrders = orders.filter(order => 
        order.createdAt > thirtySecondsAgo
      );

      if (newOrders.length > 0) {
        newOrders.forEach(order => {
          this.showBrowserNotification(
            '🛒 New Order Received!',
            {
              body: `Order #${order.orderNumber || order.id.substring(0, 8)} - ${order.productName || 'Product'}`,
              tag: `order-${order.id}`,
              requireInteraction: true
            }
          );
        });
      }

      callback(orders);
    });

    const listenerId = 'orders-' + Date.now();
    this.listeners.set(listenerId, unsubscribe);
    return unsubscribe;
  }

  // Listen for new gift requests
  subscribeToGiftRequests(callback: (requests: any[]) => void): () => void {
    const q = query(
      collection(db, 'gift_orders'),
      where('giftType', '==', 'custom_request'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }));

      // Check for new requests
      const now = new Date();
      const thirtySecondsAgo = new Date(now.getTime() - 30000);
      
      const newRequests = requests.filter(request => 
        request.createdAt > thirtySecondsAgo &&
        (!request.adminResponse || request.adminResponse.status === 'pending')
      );

      if (newRequests.length > 0) {
        newRequests.forEach(request => {
          this.showBrowserNotification(
            '🎁 New Custom Gift Request!',
            {
              body: `From ${request.senderName} - Budget: $${request.customRequestDetails?.budget || 0}`,
              tag: `gift-${request.id}`,
              requireInteraction: true
            }
          );
        });
      }

      callback(requests);
    });

    const listenerId = 'gifts-' + Date.now();
    this.listeners.set(listenerId, unsubscribe);
    return unsubscribe;
  }

  // Listen for new user signups
  subscribeToNewUsers(callback: (users: any[]) => void): () => void {
    const q = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }));

      // Check for new users
      const now = new Date();
      const thirtySecondsAgo = new Date(now.getTime() - 30000);
      
      const newUsers = users.filter(user => 
        user.createdAt > thirtySecondsAgo
      );

      if (newUsers.length > 0) {
        newUsers.forEach(user => {
          this.showBrowserNotification(
            '👤 New User Signup!',
            {
              body: `${user.email || user.displayName || 'New user'} just signed up`,
              tag: `user-${user.id}`,
              requireInteraction: false
            }
          );
        });
      }

      callback(users);
    });

    const listenerId = 'users-' + Date.now();
    this.listeners.set(listenerId, unsubscribe);
    return unsubscribe;
  }

  // Listen for balance transactions (payments)
  subscribeToTransactions(callback: (transactions: any[]) => void): () => void {
    const q = query(
      collection(db, 'balance_transactions'),
      where('type', '==', 'deposit'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const transactions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }));

      // Check for new payments
      const now = new Date();
      const thirtySecondsAgo = new Date(now.getTime() - 30000);
      
      const newTransactions = transactions.filter(transaction => 
        transaction.createdAt > thirtySecondsAgo
      );

      if (newTransactions.length > 0) {
        newTransactions.forEach(transaction => {
          this.showBrowserNotification(
            '💰 Payment Received!',
            {
              body: `$${transaction.amount} from ${transaction.userEmail || 'User'}`,
              tag: `payment-${transaction.id}`,
              requireInteraction: false
            }
          );
        });
      }

      callback(transactions);
    });

    const listenerId = 'transactions-' + Date.now();
    this.listeners.set(listenerId, unsubscribe);
    return unsubscribe;
  }

  // Cleanup all listeners
  cleanup() {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners.clear();
  }

  // Get notification permission status
  getPermissionStatus(): NotificationPermission {
    return this.notificationPermission;
  }
}

export const notificationService = new NotificationService();