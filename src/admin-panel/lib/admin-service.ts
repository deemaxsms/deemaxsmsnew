// Admin Panel Service Layer
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { firestoreService, UserProfile, ProductListing, ProductOrder, BalanceTransaction } from '@/lib/firestore-service';
import { GiftOrder, Gift, CustomGiftRequest } from '@/lib/gift-service';
import { DashboardStats, RevenueData, AdminUser, ALLOWED_ADMIN_EMAILS } from './admin-types';
import { userNotificationService } from '@/lib/user-notification-service';

class AdminService {
  // ===== AUTHENTICATION =====
  
  async isAdminEmail(email: string): Promise<boolean> {
    return ALLOWED_ADMIN_EMAILS.includes(email);
  }

  async validateAdminAccess(email: string): Promise<boolean> {
    // Check if email is in allowed list
    if (!this.isAdminEmail(email)) {
      throw new Error('Email not authorized for admin access');
    }
    return true;
  }

  async createAdminProfile(uid: string, email: string, displayName?: string): Promise<void> {
    if (!this.isAdminEmail(email)) {
      throw new Error('Email not authorized for admin access');
    }

    const profileData: any = {
      isAdmin: true,
      adminRole: 'admin',
      adminCreatedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      email: email,
      balance: 0,
      suspended: false
    };

    // Add display name if provided
    if (displayName) {
      profileData.displayName = displayName;
    }

    // Check if user document exists
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      // Update existing document
      await updateDoc(userDocRef, profileData);
    } else {
      // Create new document with additional required fields
      profileData.createdAt = serverTimestamp();
      await setDoc(userDocRef, profileData);
    }
  }

  async updateAdminProfile(uid: string, updateData: Partial<UserProfile>): Promise<void> {
    try {
      const userDocRef = doc(db, 'users', uid);
      await updateDoc(userDocRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating admin profile:', error);
      throw error;
    }
  }

  // ===== DASHBOARD STATS =====
  
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const [users, products, orders, giftOrders] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'product_listings')),
        getDocs(collection(db, 'product_orders')),
        getDocs(collection(db, 'gift_orders'))
      ]);

      const userProfiles = users.docs.map(doc => ({ id: doc.id, ...doc.data() })) as UserProfile[];
      const productListings = products.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ProductListing[];
      const productOrders = orders.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ProductOrder[];

      // Calculate revenue from transactions
      const transactionsQuery = query(
        collection(db, 'balance_transactions'),
        where('type', '==', 'purchase'),
        orderBy('createdAt', 'desc')
      );
      const transactionsSnapshot = await getDocs(transactionsQuery);
      const totalRevenue = transactionsSnapshot.docs.reduce((sum, doc) => {
        return sum + (doc.data().amount || 0);
      }, 0);

      return {
        totalUsers: userProfiles.length,
        activeUsers: userProfiles.filter(u => u.balance > 0).length,
        totalRevenue,
        pendingOrders: productOrders.filter(o => o.status === 'pending').length,
        completedOrders: productOrders.filter(o => o.status === 'completed').length,
        totalProducts: productListings.length,
        activeProducts: productListings.filter(p => p.isActive).length,
        totalGiftOrders: giftOrders.docs.length
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  async getRevenueData(days: number = 30): Promise<RevenueData[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const transactionsQuery = query(
        collection(db, 'balance_transactions'),
        where('type', '==', 'purchase'),
        where('createdAt', '>=', Timestamp.fromDate(startDate)),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(transactionsQuery);
      const transactions = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: this.safeToDate(data.createdAt) || new Date()
        };
      });

      // Group by date
      const revenueByDate: { [key: string]: { revenue: number; orders: number } } = {};
      
      transactions.forEach(transaction => {
        const date = transaction.createdAt.toISOString().split('T')[0];
        if (!revenueByDate[date]) {
          revenueByDate[date] = { revenue: 0, orders: 0 };
        }
        revenueByDate[date].revenue += (transaction as any).amount || 0;
        revenueByDate[date].orders += 1;
      });

      return Object.entries(revenueByDate).map(([date, data]) => ({
        date,
        revenue: data.revenue,
        orders: data.orders
      })).sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      return [];
    }
  }

  // ===== USER MANAGEMENT =====
  
  async getAllUsers(limitCount: number = 100): Promise<UserProfile[]> {
    try {
      const usersQuery = query(
        collection(db, 'users'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      const snapshot = await getDocs(usersQuery);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: this.safeToDate(data.createdAt) || new Date(),
          updatedAt: this.safeToDate(data.updatedAt) || new Date()
        };
      }) as UserProfile[];
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  async updateUserBalance(userId: string, newBalance: number): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', userId), {
        balance: newBalance,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating user balance:', error);
      throw error;
    }
  }

  async suspendUser(userId: string, suspended: boolean): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', userId), {
        suspended,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating user suspension:', error);
      throw error;
    }
  }

  // ===== PRODUCT MANAGEMENT =====
  
  async getAllProducts(): Promise<ProductListing[]> {
    return await firestoreService.getAllProductListings();
  }

  async createProduct(product: Omit<ProductListing, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'product_listings'), {
        ...product,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  async updateProduct(productId: string, updates: Partial<ProductListing>): Promise<void> {
    try {
      await updateDoc(doc(db, 'product_listings', productId), {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  async deleteProduct(productId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'product_listings', productId));
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }

  // ===== ORDER MANAGEMENT =====
  
  async getAllOrders(limitCount: number = 100): Promise<ProductOrder[]> {
    return await firestoreService.getAllProductOrders();
  }

  async updateOrderStatus(orderId: string, status: string, adminNotes?: string): Promise<void> {
    try {
      // First get the order to access user details
      const orderDoc = await getDoc(doc(db, 'product_orders', orderId));
      if (!orderDoc.exists()) {
        throw new Error('Order not found');
      }
      
      const orderData = orderDoc.data() as ProductOrder;
      
      // Prevent setting to refunded if refund was already accepted
      if (status === 'refunded' && orderData.refundAccepted) {
        throw new Error('Cannot refund order - refund has already been accepted by user');
      }
      
      const updates: any = {
        status,
        updatedAt: serverTimestamp()
      };
      
      if (adminNotes) {
        updates.adminNotes = adminNotes;
      }

      // Update the order
      await updateDoc(doc(db, 'product_orders', orderId), updates);
      
      // Send user notification for all status changes
      try {
        const orderNumber = orderData.orderNumber || orderId;
        const productName = orderData.productName || 'Product';
        const category = orderData.category || 'service';
        
        switch (status) {
          case 'pending':
            await userNotificationService.createNotification({
              userId: orderData.userId,
              type: 'order_processing' as any,
              title: '⏳ Order Under Review',
              message: `Your ${category.toUpperCase()} order "${productName}" is being reviewed by our team. We'll update you soon!`,
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
            break;
            
          case 'processing':
            await userNotificationService.notifyOrderProcessing(
              orderData.userId,
              orderId,
              orderNumber,
              productName
            );
            break;
            
          case 'completed':
            await userNotificationService.notifyOrderCompleted(
              orderData.userId,
              orderId,
              orderNumber,
              productName,
              category
            );
            break;
            
          case 'cancelled':
            await userNotificationService.createNotification({
              userId: orderData.userId,
              type: 'system_message' as any,
              title: '❌ Order Cancelled',
              message: `Your ${category.toUpperCase()} order "${productName}" has been cancelled. If you have questions, please contact support.`,
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
            break;
            
          case 'refunded':
            console.log('Creating refund notification for user:', orderData.userId, 'order:', orderId);
            await userNotificationService.createNotification({
              userId: orderData.userId,
              type: 'refund_available' as any,
              title: '💸 Refund Available',
              message: `Your order "${productName}" has been refunded by admin. Click to accept your refund of $${orderData.price || orderData.amount || 0}.`,
              orderId,
              orderNumber,
              data: {
                orderId,
                orderNumber,
                productName,
                category,
                refundAmount: orderData.price || orderData.amount || 0,
                action: 'accept_refund'
              }
            });
            console.log('Refund notification created successfully');
            break;
        }
        
        console.log(`User notification sent for ${status} order ${orderId}`);
      } catch (notificationError) {
        console.error('Failed to send user notification:', notificationError);
        // Don't fail the whole operation if notification fails
      }
      
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  // Update order with fulfillment data
  async updateOrderFulfillment(orderId: string, fulfillmentData: any): Promise<void> {
    try {
      console.log('Starting order fulfillment for order:', orderId);
      console.log('Fulfillment data received:', fulfillmentData);
      
      // First get the order to access user details
      const orderDoc = await getDoc(doc(db, 'product_orders', orderId));
      if (!orderDoc.exists()) {
        throw new Error('Order not found');
      }
      
      const orderData = orderDoc.data() as ProductOrder;
      
      // Build adminResponse object without undefined values
      const adminResponse: any = {
        instructions: fulfillmentData.instructions || fulfillmentData.setupInstructions || 'Setup instructions provided',
        supportContact: 'support@smsglobe.com'
      };

      // Add credentials only if both username and password exist
      if (fulfillmentData.username && fulfillmentData.password) {
        adminResponse.credentials = `Username: ${fulfillmentData.username}\nPassword: ${fulfillmentData.password}`;
      }

      // Add download links only if configFileUrl exists
      if (fulfillmentData.configFileUrl) {
        adminResponse.downloadLinks = [fulfillmentData.configFileUrl];
      }

      // Add expiry date only if validityPeriod exists
      if (fulfillmentData.validityPeriod) {
        adminResponse.expiryDate = fulfillmentData.validityPeriod;
      }

      // Add category-specific data only if they exist
      if (fulfillmentData.qrCodeUrl) adminResponse.qrCodeUrl = fulfillmentData.qrCodeUrl;
      if (fulfillmentData.activationCode) adminResponse.activationCode = fulfillmentData.activationCode;
      if (fulfillmentData.iccid) adminResponse.iccid = fulfillmentData.iccid;
      if (fulfillmentData.pin) adminResponse.pin = fulfillmentData.pin;
      if (fulfillmentData.ipAddress) adminResponse.ipAddress = fulfillmentData.ipAddress;
      if (fulfillmentData.port) adminResponse.port = fulfillmentData.port;
      if (fulfillmentData.serverIp) adminResponse.serverIp = fulfillmentData.serverIp;
      if (fulfillmentData.rdpPort) adminResponse.rdpPort = fulfillmentData.rdpPort;
      if (fulfillmentData.serverAddress) adminResponse.serverAddress = fulfillmentData.serverAddress;
      if (fulfillmentData.protocol) adminResponse.protocol = fulfillmentData.protocol;
      if (fulfillmentData.location) adminResponse.location = fulfillmentData.location;
      if (fulfillmentData.operatingSystem) adminResponse.operatingSystem = fulfillmentData.operatingSystem;
      if (fulfillmentData.specifications) adminResponse.specifications = fulfillmentData.specifications;

      console.log('Built adminResponse:', adminResponse);

      const updates: any = {
        status: 'completed',
        fulfillmentData: fulfillmentData,
        adminResponse: adminResponse,
        adminNotes: 'Order fulfilled with product data',
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      console.log('Updates to be saved:', updates);

      // Update the order
      await updateDoc(doc(db, 'product_orders', orderId), updates);
      
      console.log('Order updated successfully');
      
      // Send user notification
      try {
        await userNotificationService.notifyOrderCompleted(
          orderData.userId,
          orderId,
          orderData.orderNumber || orderId,
          orderData.productName || 'Product',
          orderData.category || 'service'
        );
        console.log(`User notification sent for completed order ${orderId}`);
      } catch (notificationError) {
        console.error('Failed to send user notification:', notificationError);
        // Don't fail the whole operation if notification fails
      }
      
    } catch (error) {
      console.error('Error updating order fulfillment:', error);
      throw error;
    }
  }

  // Update fulfillment data only (without changing status)
  async updateFulfillmentDataOnly(orderId: string, fulfillmentData: any): Promise<void> {
    try {
      // Build adminResponse object without undefined values
      const adminResponse: any = {
        instructions: fulfillmentData.instructions || fulfillmentData.setupInstructions || 'Setup instructions provided',
        supportContact: 'support@smsglobe.com'
      };

      // Add credentials only if both username and password exist
      if (fulfillmentData.username && fulfillmentData.password) {
        adminResponse.credentials = `Username: ${fulfillmentData.username}\nPassword: ${fulfillmentData.password}`;
      }

      // Add download links only if configFileUrl exists
      if (fulfillmentData.configFileUrl) {
        adminResponse.downloadLinks = [fulfillmentData.configFileUrl];
      }

      // Add expiry date only if validityPeriod exists
      if (fulfillmentData.validityPeriod) {
        adminResponse.expiryDate = fulfillmentData.validityPeriod;
      }

      // Add category-specific data only if they exist
      if (fulfillmentData.qrCodeUrl) adminResponse.qrCodeUrl = fulfillmentData.qrCodeUrl;
      if (fulfillmentData.activationCode) adminResponse.activationCode = fulfillmentData.activationCode;
      if (fulfillmentData.iccid) adminResponse.iccid = fulfillmentData.iccid;
      if (fulfillmentData.pin) adminResponse.pin = fulfillmentData.pin;
      if (fulfillmentData.ipAddress) adminResponse.ipAddress = fulfillmentData.ipAddress;
      if (fulfillmentData.port) adminResponse.port = fulfillmentData.port;
      if (fulfillmentData.serverIp) adminResponse.serverIp = fulfillmentData.serverIp;
      if (fulfillmentData.rdpPort) adminResponse.rdpPort = fulfillmentData.rdpPort;
      if (fulfillmentData.serverAddress) adminResponse.serverAddress = fulfillmentData.serverAddress;
      if (fulfillmentData.protocol) adminResponse.protocol = fulfillmentData.protocol;
      if (fulfillmentData.location) adminResponse.location = fulfillmentData.location;
      if (fulfillmentData.operatingSystem) adminResponse.operatingSystem = fulfillmentData.operatingSystem;
      if (fulfillmentData.specifications) adminResponse.specifications = fulfillmentData.specifications;

      const updates: any = {
        fulfillmentData: fulfillmentData,
        adminResponse: adminResponse,
        updatedAt: serverTimestamp()
      };

      // Update the order
      await updateDoc(doc(db, 'product_orders', orderId), updates);
      
    } catch (error) {
      console.error('Error updating fulfillment data:', error);
      throw error;
    }
  }

  // ===== TRANSACTION MANAGEMENT =====
  
  async getAllTransactions(limitCount: number = 100) {
    try {
      const transactionsQuery = query(
        collection(db, 'balance_transactions'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      const snapshot = await getDocs(transactionsQuery);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: this.safeToDate(data.createdAt) || new Date()
        } as BalanceTransaction;
      });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  }

  // ===== GIFT ORDER MANAGEMENT =====
  
  // Helper function to safely convert Firestore timestamps
  private safeToDate(timestamp: any): Date | undefined {
    if (!timestamp) return undefined;
    if (timestamp instanceof Date) return timestamp;
    if (typeof timestamp.toDate === 'function') return timestamp.toDate();
    if (typeof timestamp === 'string') return new Date(timestamp);
    if (typeof timestamp === 'number') return new Date(timestamp);
    return undefined;
  }

  async getAllGiftOrders(limitCount: number = 100) {
    try {
      const ordersQuery = query(
        collection(db, 'gift_orders'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      const snapshot = await getDocs(ordersQuery);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: this.safeToDate(data.createdAt) || new Date(),
          updatedAt: this.safeToDate(data.updatedAt) || new Date(),
          confirmedAt: this.safeToDate(data.confirmedAt),
          shippedAt: this.safeToDate(data.shippedAt),
          deliveredAt: this.safeToDate(data.deliveredAt)
        } as GiftOrder;
      });
    } catch (error) {
      console.error('Error fetching gift orders:', error);
      throw error;
    }
  }

  async updateGiftOrderStatus(orderId: string, status: string, adminNotes?: string): Promise<void> {
    try {
      const updates: any = {
        status,
        updatedAt: serverTimestamp()
      };
      
      if (adminNotes) {
        updates.adminNotes = adminNotes;
      }

      // Add timestamps for specific statuses
      if (status === 'shipped') {
        updates.shippedAt = serverTimestamp();
      } else if (status === 'delivered') {
        updates.deliveredAt = serverTimestamp();
      }

      await updateDoc(doc(db, 'gift_orders', orderId), updates);
    } catch (error) {
      console.error('Error updating gift order status:', error);
      throw error;
    }
  }

  async updateGiftOrderTracking(orderId: string, trackingNumber: string, courierName: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'gift_orders', orderId), {
        trackingNumber,
        courierName,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating gift order tracking:', error);
      throw error;
    }
  }

  // ===== SYSTEM SETTINGS =====
  
  async getSystemSettings() {
    try {
      const settingsDoc = await getDoc(doc(db, 'system_settings', 'general'));
      return settingsDoc.exists() ? settingsDoc.data() : {};
    } catch (error) {
      console.error('Error fetching system settings:', error);
      return {};
    }
  }

  async updateSystemSettings(settings: any): Promise<void> {
    try {
      await updateDoc(doc(db, 'system_settings', 'general'), {
        ...settings,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating system settings:', error);
      throw error;
    }
  }

  // ===== GIFT CATALOG MANAGEMENT =====
  
  async getAllGifts(limitCount: number = 100) {
    try {
      const giftsQuery = query(
        collection(db, 'gifts'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      const snapshot = await getDocs(giftsQuery);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: this.safeToDate(data.createdAt) || new Date(),
          updatedAt: this.safeToDate(data.updatedAt) || new Date()
        } as Gift;
      });
    } catch (error) {
      console.error('Error fetching gifts:', error);
      throw error;
    }
  }

  async createGift(giftData: any): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'gifts'), {
        ...giftData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating gift:', error);
      throw error;
    }
  }

  async updateGift(giftId: string, giftData: any): Promise<void> {
    try {
      await updateDoc(doc(db, 'gifts', giftId), {
        ...giftData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating gift:', error);
      throw error;
    }
  }

  async deleteGift(giftId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'gifts', giftId));
    } catch (error) {
      console.error('Error deleting gift:', error);
      throw error;
    }
  }

  async getAllGiftCategories() {
    try {
      const categoriesQuery = query(
        collection(db, 'gift_categories'),
        orderBy('sortOrder', 'asc')
      );
      const snapshot = await getDocs(categoriesQuery);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: this.safeToDate(data.createdAt) || new Date()
        };
      });
    } catch (error) {
      console.error('Error fetching gift categories:', error);
      throw error;
    }
  }

  async createGiftCategory(categoryData: any): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'gift_categories'), {
        ...categoryData,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating gift category:', error);
      throw error;
    }
  }

  async updateGiftCategory(categoryId: string, categoryData: any): Promise<void> {
    try {
      await updateDoc(doc(db, 'gift_categories', categoryId), categoryData);
    } catch (error) {
      console.error('Error updating gift category:', error);
      throw error;
    }
  }

  async deleteGiftCategory(categoryId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'gift_categories', categoryId));
    } catch (error) {
      console.error('Error deleting gift category:', error);
      throw error;
    }
  }

  // ===== CUSTOM GIFT REQUESTS =====
  
  async getAllCustomGiftRequests(limitCount: number = 100) {
    try {
      const requestsQuery = query(
        collection(db, 'custom_gift_requests'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      const snapshot = await getDocs(requestsQuery);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: this.safeToDate(data.createdAt) || new Date(),
          updatedAt: this.safeToDate(data.updatedAt) || new Date(),
          reviewedAt: this.safeToDate(data.reviewedAt)
        } as CustomGiftRequest;
      });
    } catch (error) {
      console.error('Error fetching custom gift requests:', error);
      throw error;
    }
  }

  async updateCustomGiftRequestStatus(
    requestId: string, 
    status: 'pending' | 'approved' | 'rejected' | 'priced' | 'completed',
    adminResponse?: any
  ): Promise<void> {
    try {
      const updates: any = {
        status,
        updatedAt: serverTimestamp(),
        reviewedAt: serverTimestamp()
      };
      
      if (adminResponse) {
        updates.adminResponse = adminResponse;
      }

      await updateDoc(doc(db, 'custom_gift_requests', requestId), updates);
    } catch (error) {
      console.error('Error updating custom gift request status:', error);
      throw error;
    }
  }
}

export const adminService = new AdminService();