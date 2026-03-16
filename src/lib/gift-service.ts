// Gift Catalog and Order Management Service
import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  doc, 
  query, 
  where, 
  orderBy, 
  updateDoc, 
  deleteDoc,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { shippingService } from './shipping-service';
import { addressService, SavedAddress } from './address-service';

// Types
export interface GiftCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
}

export interface Gift {
  id: string;
  title: string;
  slug: string;
  description: string;
  categoryId: string;
  images: string[];
  basePrice: number;
  currency: string;
  weight: number; // kg
  dimensions: {
    length: number; // cm
    width: number;
    height: number;
  };
  sizeClass: 'small' | 'medium' | 'large';
  isFragile: boolean;
  handlingTimeDays: number;
  tags: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GiftAvailability {
  id: string;
  giftId: string;
  countryCode: string;
  countryName: string;
  isAvailable: boolean;
  estimatedDeliveryDays: number;
  additionalFee: number;
  createdAt: Date;
}

export interface CustomGiftRequest {
  id: string;
  userId: string;
  title: string;
  description: string;
  budgetMin: number;
  budgetMax: number;
  preferredBrand?: string;
  preferredSpecs?: string;
  urgencyLevel: 'normal' | 'urgent';
  targetDeliveryDate: string;
  deliveryCountry: string;
  deliveryCity: string;
  addressId: string;
  referenceImages: string[];
  status: 'pending' | 'approved' | 'rejected' | 'priced' | 'completed';
  adminNotes?: string;
  adminResponse?: {
    finalPrice: number;
    shippingFee: number;
    estimatedDeliveryDays: number;
    productImages: string[];
    adminMessage: string;
  };
  createdAt: Date;
  updatedAt: Date;
  reviewedAt?: Date;
}

export interface GiftOrder {
  id: string;
  orderNumber: string;
  
  // Participants
  senderId: string;
  senderName: string;
  senderEmail: string;
  senderPhone: string;
  senderMessage?: string;
  showSenderName: boolean;
  
  // Gift Details
  giftId?: string;
  customRequestId?: string;
  giftTitle: string;
  giftImages: string[];
  quantity: number;
  
  // Pricing
  giftPrice: number;
  shippingFee: number;
  totalAmount: number;
  currency: string;
  
  // Delivery Details
  addressId: string;
  recipientName: string;
  recipientPhone: string;
  recipientEmail?: string;
  deliveryAddress: {
    countryCode: string;
    countryName: string;
    state: string;
    city: string;
    streetName: string;
    houseNumber: string;
    apartment?: string;
    landmark?: string;
    latitude: number;
    longitude: number;
    addressLine: string;
  };
  
  // Delivery Instructions
  deliveryInstructions?: string;
  preferredDeliveryTime: 'morning' | 'afternoon' | 'evening' | 'anytime';
  targetDeliveryDate: string;
  estimatedDeliveryDate: string;
  actualDeliveryDate?: string;
  
  // Status Tracking
  status: 'pending_payment' | 'confirmed' | 'processing' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled';
  trackingNumber?: string;
  courierName?: string;
  courierTrackingUrl?: string;
  
  // Payment
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: string;
  transactionId?: string;
  
  // Timestamps
  createdAt: Date;
  confirmedAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  updatedAt: Date;
}

export interface TrackingLink {
  id: string;
  orderId: string;
  trackingCode: string;
  recipientName: string;
  giftTitle: string;
  estimatedDelivery: string;
  isActive: boolean;
  viewCount: number;
  lastViewedAt?: Date;
  createdAt: Date;
}

class GiftService {
  
  // ===== HELPER FUNCTIONS =====
  
  /**
   * Clean undefined values from an object before saving to Firestore
   */
  private cleanUndefinedValues(obj: any): any {
    const cleaned: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined && value !== null) {
        if (typeof value === 'string' && value.trim() === '') {
          // Skip empty strings for optional fields
          continue;
        }
        
        if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
          // Recursively clean nested objects
          const cleanedNested = this.cleanUndefinedValues(value);
          if (Object.keys(cleanedNested).length > 0) {
            cleaned[key] = cleanedNested;
          }
        } else {
          cleaned[key] = value;
        }
      }
    }
    
    return cleaned;
  }
  
  // ===== GIFT CATEGORIES =====
  
  async getGiftCategories(): Promise<GiftCategory[]> {
    try {
      const q = query(
        collection(db, 'gift_categories'),
        where('isActive', '==', true),
        orderBy('sortOrder', 'asc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      } as GiftCategory));
    } catch (error) {
      console.error('Error fetching gift categories:', error);
      return [];
    }
  }

  // ===== GIFT CATALOG =====
  
  async getGifts(categoryId?: string): Promise<Gift[]> {
    try {
      let q = query(
        collection(db, 'gifts'),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );
      
      if (categoryId) {
        q = query(
          collection(db, 'gifts'),
          where('isActive', '==', true),
          where('categoryId', '==', categoryId),
          orderBy('createdAt', 'desc')
        );
      }
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      } as Gift));
    } catch (error) {
      console.error('Error fetching gifts:', error);
      return [];
    }
  }

  async getGiftById(giftId: string): Promise<Gift | null> {
    try {
      const docRef = doc(db, 'gifts', giftId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate(),
          updatedAt: docSnap.data().updatedAt?.toDate()
        } as Gift;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching gift:', error);
      return null;
    }
  }

  async getGiftBySlug(slug: string): Promise<Gift | null> {
    try {
      const q = query(
        collection(db, 'gifts'),
        where('slug', '==', slug),
        where('isActive', '==', true)
      );
      
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return {
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate()
        } as Gift;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching gift by slug:', error);
      return null;
    }
  }

  async searchGifts(searchTerm: string, categoryId?: string): Promise<Gift[]> {
    try {
      // Note: This is a simple search. For production, consider using Algolia or similar
      const gifts = await this.getGifts(categoryId);
      
      const searchLower = searchTerm.toLowerCase();
      return gifts.filter(gift => 
        gift.title.toLowerCase().includes(searchLower) ||
        gift.description.toLowerCase().includes(searchLower) ||
        gift.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    } catch (error) {
      console.error('Error searching gifts:', error);
      return [];
    }
  }

  // ===== GIFT AVAILABILITY =====
  
  async checkGiftAvailability(giftId: string, countryCode: string): Promise<boolean> {
    try {
      const q = query(
        collection(db, 'gift_availability'),
        where('giftId', '==', giftId),
        where('countryCode', '==', countryCode),
        where('isAvailable', '==', true)
      );
      
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error) {
      console.error('Error checking gift availability:', error);
      return false;
    }
  }

  async getGiftAvailability(giftId: string): Promise<GiftAvailability[]> {
    try {
      const q = query(
        collection(db, 'gift_availability'),
        where('giftId', '==', giftId),
        where('isAvailable', '==', true)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      } as GiftAvailability));
    } catch (error) {
      console.error('Error fetching gift availability:', error);
      return [];
    }
  }

  // ===== CUSTOM GIFT REQUESTS =====
  
  async createCustomGiftRequest(
    userId: string,
    requestData: Omit<CustomGiftRequest, 'id' | 'userId' | 'status' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'custom_gift_requests'), {
        ...requestData,
        userId,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Custom gift request created:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating custom gift request:', error);
      throw error;
    }
  }

  async getUserCustomRequests(userId: string): Promise<CustomGiftRequest[]> {
    try {
      const q = query(
        collection(db, 'custom_gift_requests'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        reviewedAt: doc.data().reviewedAt?.toDate()
      } as CustomGiftRequest));
    } catch (error) {
      console.error('Error fetching custom requests:', error);
      return [];
    }
  }

  // ===== GIFT ORDERS =====
  
  async createGiftOrder(
    orderData: Omit<GiftOrder, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>
  ): Promise<{ orderId: string; orderNumber: string; trackingCode: string }> {
    try {
      // Generate order number
      const timestamp = Date.now();
      const orderNumber = `GFT-${new Date().getFullYear()}-${timestamp.toString().slice(-6)}`;
      
      // Clean undefined values before saving to Firestore
      const cleanOrderData = this.cleanUndefinedValues({
        ...orderData,
        orderNumber,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('🎁 Creating gift order with cleaned data:', cleanOrderData);
      
      // Create order
      const docRef = await addDoc(collection(db, 'gift_orders'), cleanOrderData);
      console.log(`✅ Gift order created: ${docRef.id} - ${orderNumber}`);
      
      // Create tracking link
      const trackingCode = `GFT-TRK-${timestamp.toString(36).toUpperCase()}`;
      const trackingData = {
        orderId: docRef.id,
        trackingCode,
        recipientName: orderData.recipientName,
        giftTitle: orderData.showSenderName ? orderData.giftTitle : 'A Special Gift 🎁',
        estimatedDelivery: orderData.estimatedDeliveryDate,
        isActive: true,
        viewCount: 0,
        createdAt: serverTimestamp()
      };
      
      console.log('📦 Creating tracking link:', trackingData);
      
      const trackingRef = await addDoc(collection(db, 'tracking_links'), trackingData);
      console.log(`✅ Tracking link created: ${trackingRef.id} - ${trackingCode}`);
      
      return {
        orderId: docRef.id,
        orderNumber,
        trackingCode
      };
    } catch (error) {
      console.error('Error creating gift order:', error);
      throw error;
    }
  }

  async getUserOrders(userId: string): Promise<GiftOrder[]> {
    try {
      const q = query(
        collection(db, 'gift_orders'),
        where('senderId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      
      // Helper function to safely convert timestamps
      const safeToDate = (timestamp: any): Date | undefined => {
        if (!timestamp) return undefined;
        if (timestamp instanceof Date) return timestamp;
        if (typeof timestamp.toDate === 'function') return timestamp.toDate();
        if (typeof timestamp === 'string') return new Date(timestamp);
        if (typeof timestamp === 'number') return new Date(timestamp);
        return undefined;
      };
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: safeToDate(data.createdAt),
          updatedAt: safeToDate(data.updatedAt),
          confirmedAt: safeToDate(data.confirmedAt),
          shippedAt: safeToDate(data.shippedAt),
          deliveredAt: safeToDate(data.deliveredAt)
        } as GiftOrder;
      });
    } catch (error) {
      console.error('Error fetching user orders:', error);
      return [];
    }
  }

  async getOrderById(orderId: string): Promise<GiftOrder | null> {
    try {
      const docRef = doc(db, 'gift_orders', orderId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Helper function to safely convert timestamps
        const safeToDate = (timestamp: any): Date | undefined => {
          if (!timestamp) return undefined;
          if (timestamp instanceof Date) return timestamp;
          if (typeof timestamp.toDate === 'function') return timestamp.toDate();
          if (typeof timestamp === 'string') return new Date(timestamp);
          if (typeof timestamp === 'number') return new Date(timestamp);
          return undefined;
        };
        
        return {
          id: docSnap.id,
          ...data,
          createdAt: safeToDate(data.createdAt),
          updatedAt: safeToDate(data.updatedAt),
          confirmedAt: safeToDate(data.confirmedAt),
          shippedAt: safeToDate(data.shippedAt),
          deliveredAt: safeToDate(data.deliveredAt)
        } as GiftOrder;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching order:', error);
      return null;
    }
  }

  // ===== TRACKING =====
  
  async getTrackingInfo(trackingCode: string): Promise<{
    order: GiftOrder | null;
    trackingLink: TrackingLink | null;
  }> {
    try {
      console.log(`🔍 Searching for tracking code: ${trackingCode}`);
      
      // Find tracking link
      const trackingQuery = query(
        collection(db, 'tracking_links'),
        where('trackingCode', '==', trackingCode),
        where('isActive', '==', true)
      );
      
      const trackingSnapshot = await getDocs(trackingQuery);
      if (trackingSnapshot.empty) {
        console.log(`❌ No tracking link found for code: ${trackingCode}`);
        return { order: null, trackingLink: null };
      }
      
      const trackingDoc = trackingSnapshot.docs[0];
      const trackingData = trackingDoc.data();
      
      console.log(`✅ Found tracking link: ${trackingDoc.id}`, trackingData);
      
      // Helper function to safely convert timestamps
      const safeToDate = (timestamp: any): Date | undefined => {
        if (!timestamp) return undefined;
        if (timestamp instanceof Date) return timestamp;
        if (typeof timestamp.toDate === 'function') return timestamp.toDate();
        if (typeof timestamp === 'string') return new Date(timestamp);
        if (typeof timestamp === 'number') return new Date(timestamp);
        return undefined;
      };
      
      const trackingLink = {
        id: trackingDoc.id,
        ...trackingData,
        createdAt: safeToDate(trackingData.createdAt),
        lastViewedAt: safeToDate(trackingData.lastViewedAt)
      } as TrackingLink;
      
      // Increment view count
      await updateDoc(trackingDoc.ref, {
        viewCount: (trackingLink.viewCount || 0) + 1,
        lastViewedAt: serverTimestamp()
      });
      
      // Get order details
      const order = await this.getOrderById(trackingLink.orderId);
      
      console.log(`✅ Retrieved order for tracking: ${order?.orderNumber || 'Not found'}`);
      
      return { order, trackingLink };
    } catch (error) {
      console.error('Error fetching tracking info:', error);
      return { order: null, trackingLink: null };
    }
  }

  // ===== ORDER PROCESSING =====
  
  async processGiftPurchase(
    userId: string,
    giftId: string,
    addressId: string,
    orderDetails: {
      quantity: number;
      senderMessage?: string;
      showSenderName: boolean;
      deliveryInstructions?: string;
      preferredDeliveryTime: 'morning' | 'afternoon' | 'evening' | 'anytime';
      targetDeliveryDate: string;
    }
  ): Promise<{ success: boolean; orderId?: string; orderNumber?: string; trackingCode?: string; error?: string }> {
    try {
      // Get gift details
      const gift = await this.getGiftById(giftId);
      if (!gift) {
        return { success: false, error: 'Gift not found' };
      }

      // Get address details
      const addresses = await addressService.getUserAddresses(userId);
      const address = addresses.find(addr => addr.id === addressId);
      if (!address) {
        return { success: false, error: 'Delivery address not found' };
      }

      // Check availability
      const isAvailable = await this.checkGiftAvailability(giftId, address.countryCode);
      if (!isAvailable) {
        return { success: false, error: `This gift is not available for delivery to ${address.countryName}` };
      }

      // Calculate shipping
      const shippingCalculation = await shippingService.calculateShippingFee(
        {
          id: gift.id,
          title: gift.title,
          weight: gift.weight,
          sizeClass: gift.sizeClass,
          isFragile: gift.isFragile
        },
        {
          countryCode: address.countryCode,
          countryName: address.countryName,
          state: address.state,
          city: address.city,
          latitude: address.latitude,
          longitude: address.longitude
        }
      );

      // Get estimated delivery date
      const deliveryDays = await shippingService.getEstimatedDeliveryDays(address.countryCode);
      const estimatedDeliveryDate = new Date();
      estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + deliveryDays + gift.handlingTimeDays);

      // Create order with pending payment status
      const result = await this.createGiftOrder({
        senderId: userId,
        senderName: '', // Will be filled from user profile
        senderEmail: '', // Will be filled from user profile
        senderPhone: '', // Will be filled from user profile
        senderMessage: orderDetails.senderMessage,
        showSenderName: orderDetails.showSenderName,
        
        giftId: gift.id,
        giftTitle: gift.title,
        giftImages: gift.images,
        quantity: orderDetails.quantity,
        
        giftPrice: gift.basePrice * orderDetails.quantity,
        shippingFee: shippingCalculation.totalFee,
        totalAmount: (gift.basePrice * orderDetails.quantity) + shippingCalculation.totalFee,
        currency: gift.currency,
        
        addressId: address.id,
        recipientName: address.recipientName,
        recipientPhone: address.recipientPhone,
        recipientEmail: address.recipientEmail,
        deliveryAddress: {
          countryCode: address.countryCode,
          countryName: address.countryName,
          state: address.state,
          city: address.city,
          streetName: address.streetName,
          houseNumber: address.houseNumber,
          apartment: address.apartment,
          landmark: address.landmark,
          latitude: address.latitude,
          longitude: address.longitude,
          addressLine: address.addressLine
        },
        
        deliveryInstructions: orderDetails.deliveryInstructions,
        preferredDeliveryTime: orderDetails.preferredDeliveryTime,
        targetDeliveryDate: orderDetails.targetDeliveryDate,
        estimatedDeliveryDate: estimatedDeliveryDate.toISOString().split('T')[0],
        
        status: 'pending_payment',
        paymentStatus: 'pending',
        paymentMethod: 'balance'
      });

      // Mark address as used
      await addressService.markAddressAsUsed(addressId);

      return {
        success: true,
        orderId: result.orderId,
        orderNumber: result.orderNumber,
        trackingCode: result.trackingCode
      };

    } catch (error) {
      console.error('Error processing gift purchase:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process purchase'
      };
    }
  }

  // ===== PAYMENT PROCESSING =====
  
  async processGiftPayment(
    userId: string,
    orderId: string,
    amount: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Import firestoreService
      const { firestoreService } = await import('./firestore-service');
      
      // Get user profile
      const profile = await firestoreService.getUserProfile(userId);
      if (!profile) {
        return { success: false, error: 'User profile not found' };
      }

      // Check balance
      if (profile.balance < amount) {
        return { success: false, error: 'Insufficient balance' };
      }

      // Calculate new balance
      const newBalance = profile.balance - amount;

      // Update balance in Firestore
      await firestoreService.updateUserBalance(userId, newBalance);
      console.log(`✅ Balance updated: ${profile.balance} → ${newBalance}`);

      // Get order details for transaction record
      const order = await this.getOrderById(orderId);
      if (!order) {
        return { success: false, error: 'Order not found' };
      }

      // Record transaction
      await firestoreService.addBalanceTransaction({
        userId,
        type: 'purchase',
        amount: -amount,
        description: `Gift purchase: ${order.giftTitle} - Order #${order.orderNumber}`,
        balanceAfter: newBalance,
        transactionId: orderId
      });
      console.log(`✅ Transaction recorded: -$${amount}`);

      // Update order payment status
      await this.updateOrderPaymentStatus(orderId, 'completed', 'confirmed');

      return { success: true };
    } catch (error) {
      console.error('Error processing gift payment:', error);
      return { success: false, error: 'Payment processing failed' };
    }
  }

  async processGiftRefund(
    userId: string,
    orderId: string,
    amount: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Import firestoreService
      const { firestoreService } = await import('./firestore-service');
      
      // Get user profile
      const profile = await firestoreService.getUserProfile(userId);
      if (!profile) {
        return { success: false, error: 'User profile not found' };
      }

      // Calculate new balance
      const newBalance = profile.balance + amount;

      // Update balance in Firestore
      await firestoreService.updateUserBalance(userId, newBalance);
      console.log(`✅ Refund processed: ${profile.balance} → ${newBalance}`);

      // Get order details for transaction record
      const order = await this.getOrderById(orderId);
      if (!order) {
        return { success: false, error: 'Order not found' };
      }

      // Record transaction
      await firestoreService.addBalanceTransaction({
        userId,
        type: 'refund',
        amount: amount,
        description: `Gift order refund: ${order.giftTitle} - Order #${order.orderNumber}`,
        balanceAfter: newBalance,
        transactionId: orderId
      });
      console.log(`✅ Refund transaction recorded: +$${amount}`);

      return { success: true };
    } catch (error) {
      console.error('Error processing gift refund:', error);
      return { success: false, error: 'Refund processing failed' };
    }
  }
  
  async updateOrderPaymentStatus(
    orderId: string, 
    paymentStatus: 'completed' | 'failed' | 'refunded',
    orderStatus?: 'confirmed' | 'cancelled'
  ): Promise<boolean> {
    try {
      const updateData: any = {
        paymentStatus,
        updatedAt: serverTimestamp()
      };
      
      if (orderStatus) {
        updateData.status = orderStatus;
        if (orderStatus === 'confirmed') {
          updateData.confirmedAt = serverTimestamp();
        }
      }
      
      const orderRef = doc(db, 'gift_orders', orderId);
      await updateDoc(orderRef, updateData);
      
      // Send payment confirmation notification
      if (paymentStatus === 'completed' && orderStatus === 'confirmed') {
        try {
          const orderDoc = await getDoc(orderRef);
          if (orderDoc.exists()) {
            const orderData = orderDoc.data();
            const { userNotificationService } = await import('./user-notification-service');
            
            await userNotificationService.notifyPaymentConfirmed(
              orderData.userId,
              orderId,
              orderData.orderNumber || orderId,
              orderData.giftTitle || 'Gift Order',
              orderData.totalAmount || 0
            );
            console.log(`Payment confirmation notification sent for gift order ${orderId}`);
          }
        } catch (notificationError) {
          console.error('Failed to send payment confirmation notification:', notificationError);
          // Don't fail the payment update if notification fails
        }
      }
      
      console.log(`✅ Updated order ${orderId} payment status to ${paymentStatus}`);
      return true;
    } catch (error) {
      console.error('Error updating payment status:', error);
      return false;
    }
  }

  async cancelOrder(orderId: string, reason: string = 'User requested'): Promise<{ success: boolean; refundAmount?: number; error?: string }> {
    try {
      const order = await this.getOrderById(orderId);
      if (!order) {
        return { success: false, error: 'Order not found' };
      }

      // Check if order can be cancelled (within 24 hours and not delivered)
      const orderAge = Date.now() - order.createdAt.getTime();
      const canCancel = orderAge <= 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      
      if (!canCancel && order.status !== 'pending_payment') {
        return { success: false, error: 'Order can only be cancelled within 24 hours of placement' };
      }

      if (order.status === 'delivered') {
        return { success: false, error: 'Delivered orders cannot be cancelled' };
      }

      // Process refund if payment was completed
      let refundAmount = 0;
      if (order.paymentStatus === 'completed') {
        const refundResult = await this.processGiftRefund(order.senderId, orderId, order.totalAmount);
        if (!refundResult.success) {
          return { success: false, error: refundResult.error || 'Refund processing failed' };
        }
        refundAmount = order.totalAmount;
      }

      // Update order status
      const orderRef = doc(db, 'gift_orders', orderId);
      await updateDoc(orderRef, {
        status: 'cancelled',
        paymentStatus: order.paymentStatus === 'completed' ? 'refunded' : 'cancelled',
        updatedAt: serverTimestamp()
      });

      // Deactivate tracking link
      const trackingQuery = query(
        collection(db, 'tracking_links'),
        where('orderId', '==', orderId)
      );
      const trackingSnapshot = await getDocs(trackingQuery);
      
      for (const trackingDoc of trackingSnapshot.docs) {
        await updateDoc(trackingDoc.ref, {
          isActive: false,
          updatedAt: serverTimestamp()
        });
      }
      
      console.log(`✅ Cancelled order ${orderId}, refund: ${refundAmount}`);
      return { success: true, refundAmount };
    } catch (error) {
      console.error('Error cancelling order:', error);
      return { success: false, error: 'Failed to cancel order' };
    }
  }
}

export const giftService = new GiftService();