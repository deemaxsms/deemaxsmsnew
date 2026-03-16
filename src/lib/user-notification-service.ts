// User notification service for order updates
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  limit,
  serverTimestamp,
  updateDoc,
  doc,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface UserNotification {
  id: string;
  userId: string;
  type: 'order_placed' | 'order_completed' | 'order_processing' | 'payment_confirmed' | 'refund_available' | 'system_message';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: Date;
  orderId?: string;
  orderNumber?: string;
}

class UserNotificationService {
  // Create a notification for a user
  async createNotification(notification: Omit<UserNotification, 'id' | 'createdAt' | 'isRead'>): Promise<string> {
    try {
      console.log('Creating notification:', notification);
      const docRef = await addDoc(collection(db, 'user_notifications'), {
        ...notification,
        isRead: false,
        createdAt: serverTimestamp()
      });
      
      console.log('User notification created successfully:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating user notification:', error);
      throw error;
    }
  }

  // Notify user when order is completed
  async notifyOrderCompleted(userId: string, orderId: string, orderNumber: string, productName: string, category: string): Promise<void> {
    try {
      await this.createNotification({
        userId,
        type: 'order_completed',
        title: '🎉 Order Completed!',
        message: `Your ${category.toUpperCase()} order "${productName}" is ready! Check your order details to access your service.`,
        orderId,
        orderNumber,
        data: {
          orderId,
          orderNumber,
          productName,
          category,
          action: 'view_order'
        }
      });
      
      console.log(`Order completion notification sent to user ${userId} for order ${orderNumber}`);
    } catch (error) {
      console.error('Error sending order completion notification:', error);
    }
  }

  // Notify user when order is placed
  async notifyOrderPlaced(userId: string, orderId: string, orderNumber: string, productName: string, category: string): Promise<void> {
    try {
      await this.createNotification({
        userId,
        type: 'order_placed' as any,
        title: '📦 Order Placed Successfully!',
        message: `Your ${category.toUpperCase()} order "${productName}" has been placed and is being reviewed. You'll receive updates as we process your order.`,
        orderId,
        orderNumber,
        data: {
          orderId,
          orderNumber,
          productName,
          category,
          action: 'view_order'
        }
      });
      
      console.log(`Order placement notification sent to user ${userId} for order ${orderNumber}`);
    } catch (error) {
      console.error('Error sending order placement notification:', error);
    }
  }

  // Notify user when payment is confirmed
  async notifyPaymentConfirmed(userId: string, orderId: string, orderNumber: string, productName: string, amount: number): Promise<void> {
    try {
      await this.createNotification({
        userId,
        type: 'payment_confirmed',
        title: '💰 Payment Confirmed!',
        message: `Payment of $${amount.toFixed(2)} for "${productName}" has been confirmed. Your order is now being processed.`,
        orderId,
        orderNumber,
        data: {
          orderId,
          orderNumber,
          productName,
          amount,
          action: 'view_order'
        }
      });
    } catch (error) {
      console.error('Error sending payment confirmation notification:', error);
    }
  }
  async notifyOrderProcessing(userId: string, orderId: string, orderNumber: string, productName: string): Promise<void> {
    try {
      await this.createNotification({
        userId,
        type: 'order_processing',
        title: '⏳ Order Processing',
        message: `Your order "${productName}" is now being processed. You'll receive your access details soon!`,
        orderId,
        orderNumber,
        data: {
          orderId,
          orderNumber,
          productName,
          action: 'view_order'
        }
      });
    } catch (error) {
      console.error('Error sending order processing notification:', error);
    }
  }

  // Subscribe to user notifications
  subscribeToUserNotifications(userId: string, callback: (notifications: UserNotification[]) => void): () => void {
    const q = query(
      collection(db, 'user_notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as UserNotification[];

      callback(notifications);
    });

    return unsubscribe;
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'user_notifications', notificationId), {
        isRead: true
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  // Accept refund and update user balance
  async acceptRefund(userId: string, orderId: string, refundAmount: number): Promise<{ success: boolean; error?: string }> {
    try {
      const { firestoreService } = await import('@/lib/firestore-service');
      
      // Get current user profile
      const profile = await firestoreService.getUserProfile(userId);
      if (!profile) {
        return { success: false, error: 'User profile not found' };
      }

      // Calculate new balance
      const newBalance = (profile.balance || 0) + refundAmount;

      // Update user balance
      await firestoreService.updateUserBalance(userId, newBalance);

      // Add refund transaction
      await firestoreService.addBalanceTransaction({
        userId,
        type: 'refund',
        amount: refundAmount,
        description: `Refund accepted for order ${orderId}`,
        balanceAfter: newBalance
      });

      // Update order status to prevent multiple refunds
      const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      await updateDoc(doc(db, 'product_orders', orderId), {
        refundAccepted: true,
        refundAcceptedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Trigger real-time balance update in UI
      try {
        window.dispatchEvent(new CustomEvent('balanceUpdated', { 
          detail: { newBalance, increase: refundAmount } 
        }));
        console.log(`✅ Refund balance update event dispatched: ${newBalance}`);
      } catch (eventError) {
        console.warn('Failed to dispatch refund balance update event:', eventError);
      }

      console.log(`Refund accepted: $${refundAmount} added to user ${userId} balance`);
      return { success: true };
    } catch (error) {
      console.error('Error accepting refund:', error);
      return { success: false, error: 'Failed to process refund acceptance' };
    }
  }
  async markAllAsRead(userId: string): Promise<void> {
    try {
      const q = query(
        collection(db, 'user_notifications'),
        where('userId', '==', userId),
        where('isRead', '==', false)
      );

      const snapshot = await getDocs(q);
      const batch = writeBatch(db);

      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { isRead: true });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }
}

export const userNotificationService = new UserNotificationService();