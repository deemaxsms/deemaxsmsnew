/* eslint-disable @typescript-eslint/no-explicit-any */
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs,
  addDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp
} from "firebase/firestore";
import { db } from "./firebase";
import { validatePurchaseRequest, validateTransaction, validateProductOrder, cleanFirestoreData } from "./transaction-validator";
import { SMSMessageRecord } from "@/types/sms-types";

// User Profile
export interface UserProfile {
  phoneNumber: any;
  suspended: unknown;
  id: string;
  email: string;
  username?: string;
  displayName?: string;
  photoURL?: string;
  balance: number;
  cashback: number;
  useCashbackFirst: boolean;
  referralCode: string;
  referredBy: string | null;
  referralCount: number;
  referralEarnings: number;
  apiKey?: string;
  isAdmin?: boolean;
  createdAt?: Timestamp | any;
  updatedAt?: Timestamp | any;
}

// Referred User (for referral list)
export interface ReferredUser {
  id: string;
  email: string;
  username?: string;
  createdAt?: Timestamp | any;
}

// Balance Transaction
export interface BalanceTransaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'purchase' | 'refund' | 'referral_bonus';
  amount: number;
  description: string;
  balanceAfter: number;
  txRef?: string;
  transactionId?: string;
  createdAt?: Timestamp | any;
}

// Activation/Order
export interface Activation {
  id: string;
  userId: string;
  service: string;
  country: string;
  phoneNumber: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  smsCode?: string;
  price: number;
  externalId?: string;
  createdAt?: Timestamp | any;
  updatedAt?: Timestamp | any;
}

// Product Category Types
export type ProductCategory = 'esim' | 'proxy' | 'vpn' | 'rdp' | 'sms' | 'gift';

// Product Listing (admin-managed)
export interface ProductListing {
  [x: string]: any;
  provider: string;
  id: string;
  category: ProductCategory;
  name: string;
  description: string;
  price: number;
  features: string[];
  duration?: string; // e.g., "30 days", "1 month"
  region?: string;
  stock?: number;
  isActive: boolean;
  outOfStock?: boolean;
  slug?: string;
  imageFilename?: string; // filename stored in /assets/proxy-vpn/
  link?: string; // optional external or provider link; admin can fill
  createdAt?: Timestamp | any;
  updatedAt?: Timestamp | any;
}

// Product Order
export interface ProductOrder {
  id: string;
  userId: string;
  orderNumber: string;
  amount: number;
  deliveryInfo: any;
  userEmail: string;
  username?: string;
  productId: string;
  productName: string;
  category: ProductCategory;
  price: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded';
  
  // Refund tracking
  refundAccepted?: boolean;
  refundAcceptedAt?: Date;
  
  // Customer request details
  requestDetails?: {
    location?: string;
    duration?: string;
    specifications?: string;
    additionalNotes?: string;
  };
  
  // Admin response
  deliveryDetails?: string; // Admin fills this with VPN credentials, eSIM details, etc.
  adminNotes?: string;
  adminResponse?: {
    credentials?: string;
    instructions?: string;
    downloadLinks?: string[];
    expiryDate?: string;
    supportContact?: string;
    // Category-specific fields
    qrCodeUrl?: string;
    activationCode?: string;
    iccid?: string;
    pin?: string;
    ipAddress?: string;
    port?: string;
    serverIp?: string;
    rdpPort?: string;
    username?: string;
    password?: string;
    serverAddress?: string;
    configFileUrl?: string;
    protocol?: string;
    location?: string;
    operatingSystem?: string;
    specifications?: string;
  };
  
  // Fulfillment data (new structure)
  fulfillmentData?: {
    // eSIM specific
    qrCodeUrl?: string;
    activationCode?: string;
    iccid?: string;
    pin?: string;
    validityPeriod?: string;
    
    // RDP specific
    serverIp?: string;
    rdpPort?: string;
    username?: string;
    password?: string;
    operatingSystem?: string;
    location?: string;
    specifications?: string;
    
    // Proxy specific
    ipAddress?: string;
    port?: string;
    protocol?: string;
    
    // VPN specific
    serverAddress?: string;
    configFileUrl?: string;
    
    // Common fields
    instructions?: string;
    setupInstructions?: string;
  };
  
  // Timestamps
  createdAt?: Timestamp | any;
  updatedAt?: Timestamp | any;
  completedAt?: Timestamp | any;
  processedAt?: Timestamp | any;
}

// SMS Order Types
export type SMSOrderType = 'one-time' | 'long-term';
export type SMSOrderStatus = 'pending' | 'awaiting_mdn' | 'reserved' | 'active' | 'completed' | 'rejected' | 'timed_out' | 'cancelled' | 'expired';

export interface SMSOrder {
  id: string;
  userId: string;
  userEmail: string;
  username?: string;
  orderType: SMSOrderType;
  service: string;
  mdn?: string; // Mobile Directory Number
  externalId: string; // Tellabot request ID
  status: SMSOrderStatus;
  price: number; // Price with markup
  basePrice: number; // Original price from API
  markup: number; // Markup amount
  carrier?: string;
  state?: string; // For geo-targeted requests
  expiresAt?: Timestamp | any; // For long-term rentals
  autoRenew?: boolean; // For long-term rentals
  duration?: number; // Duration in days for long-term
  smsMessages?: SMSMessage[];
  createdAt?: Timestamp | any;
  updatedAt?: Timestamp | any;
  activatedAt?: Timestamp | any;
  completedAt?: Timestamp | any;
}

export interface SMSMessage {
  id: string;
  timestamp: number;
  dateTime: string;
  from: string;
  to: string;
  service: string;
  price: number;
  reply: string;
  pin?: string;
  receivedAt: Timestamp | any;
}

export interface SMSTellabotService {
  name: string;
  price: number; // Base price
  ltr_price: number; // Long-term price
  ltr_short_price: number; // Short-term price
  available: number;
  ltr_available: number;
  recommended_markup: number;
}

export const firestoreService = {
  // ===== USER PROFILE =====
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as UserProfile;
    }
    return null;
  },

  async updateUserProfile(userId: string, data: Partial<UserProfile>) {
    const docRef = doc(db, "users", userId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  },

  async updateUserBalance(userId: string, newBalance: number) {
    const docRef = doc(db, "users", userId);
    await updateDoc(docRef, {
      balance: newBalance,
      updatedAt: serverTimestamp()
    });
  },

  // ===== USERNAME FUNCTIONS =====
  async checkUsernameAvailable(username: string): Promise<boolean> {
    try {
      console.log('Checking username availability for:', username);
      
      // Check the usernames collection (public readable)
      const usernameDocRef = doc(db, "usernames", username.toLowerCase());
      const usernameDoc = await getDoc(usernameDocRef);
      
      // If document exists, username is taken
      const isAvailable = !usernameDoc.exists();
      console.log('Username availability result:', isAvailable);
      return isAvailable;
    } catch (error: any) {
      console.error('Error checking username availability:', error);
      
      // If it's a permission error, we can't verify the username
      if (error?.code === 'permission-denied' || error?.message?.includes('permission')) {
        console.log('Permission denied for username check - allowing signup to proceed');
        // Return true to allow signup to proceed (username will be validated server-side)
        return true;
      }
      
      // For other errors, assume username is taken to be safe
      return false;
    }
  },

  async setUsername(userId: string, username: string): Promise<{ success: boolean; error?: string }> {
    const isAvailable = await this.checkUsernameAvailable(username);
    if (!isAvailable) {
      return { success: false, error: "Username is already taken" };
    }
    
    // Reserve username in usernames collection
    await setDoc(doc(db, "usernames", username.toLowerCase()), {
      userId: userId,
      createdAt: serverTimestamp()
    });
    
    // Update user profile
    await this.updateUserProfile(userId, { username: username.toLowerCase() });
    return { success: true };
  },

  async getUserByUsername(username: string): Promise<UserProfile | null> {
    const colRef = collection(db, "users");
    const q = query(colRef, where("username", "==", username.toLowerCase()));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const docSnap = snapshot.docs[0];
      return { id: docSnap.id, ...docSnap.data() } as UserProfile;
    }
    return null;
  },

  async getUserByEmail(email: string): Promise<UserProfile | null> {
    const colRef = collection(db, "users");
    const q = query(colRef, where("email", "==", email.toLowerCase()));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const docSnap = snapshot.docs[0];
      return { id: docSnap.id, ...docSnap.data() } as UserProfile;
    }
    return null;
  },

  generateUsernameSuggestions(email: string, displayName?: string): string[] {
    const suggestions: string[] = [];
    const baseNames: string[] = [];
    
    // Extract from email
    const emailBase = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    if (emailBase.length >= 3) baseNames.push(emailBase);
    
    // Extract from display name
    if (displayName) {
      const nameBase = displayName.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      if (nameBase.length >= 3) baseNames.push(nameBase);
      
      // First name only
      const firstName = displayName.split(' ')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      if (firstName.length >= 3) baseNames.push(firstName);
    }
    
    // Generate suggestions with numbers
    baseNames.forEach(base => {
      suggestions.push(base);
      suggestions.push(`${base}${Math.floor(Math.random() * 999)}`);
      suggestions.push(`${base}_${Math.floor(Math.random() * 99)}`);
    });
    
    return [...new Set(suggestions)].slice(0, 5);
  },

  // ===== BALANCE TRANSACTIONS =====
  async addBalanceTransaction(transaction: Omit<BalanceTransaction, 'id' | 'createdAt'>) {
    const colRef = collection(db, "balance_transactions");
    
    // Clean transaction data to remove undefined values
    const cleanTransaction = {
      userId: transaction.userId,
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description,
      balanceAfter: transaction.balanceAfter,
      txRef: transaction.txRef || null,
      transactionId: transaction.transactionId || null,
      createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(colRef, cleanTransaction);
    return docRef.id;
  },

  async getUserTransactions(userId: string): Promise<BalanceTransaction[]> {
    const colRef = collection(db, "balance_transactions");
    const q = query(
      colRef, 
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BalanceTransaction));
  },

  // ===== SIMPLE PAYMENT PROCESSING =====
  async processPayment(userId: string, amountUSD: number, amountNGN: number, txRef: string, transactionId: string) {
    const profile = await this.getUserProfile(userId);
    if (!profile) throw new Error('User profile not found');

    const newBalance = (profile.balance || 0) + amountUSD;

    try {
      // Update user balance
      await this.updateUserBalance(userId, newBalance);

      // Add transaction record
      await this.addBalanceTransaction({
        userId,
        type: 'deposit',
        amount: amountUSD,
        description: `Top up via Flutterwave - ₦${amountNGN.toLocaleString()}`,
        balanceAfter: newBalance,
        txRef,
        transactionId
      });

      return { success: true, newBalance };
    } catch (err) {
      console.error('Error processing payment:', err);
      throw err;
    }
  },

  // ===== ACTIVATIONS/ORDERS =====
  async createActivation(activation: Omit<Activation, 'id' | 'createdAt' | 'updatedAt'>) {
    const colRef = collection(db, "activations");
    const docRef = await addDoc(colRef, {
      ...activation,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  },

  async getUserActivations(userId: string): Promise<Activation[]> {
    const colRef = collection(db, "activations");
    const q = query(
      colRef,
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Activation));
  },

  async updateActivation(activationId: string, data: Partial<Activation>) {
    const docRef = doc(db, "activations", activationId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  },

  // ===== REFERRALS =====
  async applyReferralCode(userId: string, referralCode: string): Promise<boolean> {
    const colRef = collection(db, "users");
    const q = query(colRef, where("referralCode", "==", referralCode));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return false;
    }
    
    const referrer = snapshot.docs[0];
    const referrerId = referrer.id;
    
    if (referrerId === userId) {
      return false;
    }
    
    await this.updateUserProfile(userId, { referredBy: referrerId });
    
    const referrerData = referrer.data();
    const newReferralCount = (referrerData.referralCount || 0) + 1;
    const bonusAmount = 1;
    const newReferralEarnings = (referrerData.referralEarnings || 0) + bonusAmount;
    const newBalance = (referrerData.balance || 0) + bonusAmount;
    
    await updateDoc(doc(db, "users", referrerId), {
      referralCount: newReferralCount,
      referralEarnings: newReferralEarnings,
      balance: newBalance,
      updatedAt: serverTimestamp()
    });

    // Update user_balances collection
    const balanceRef = doc(db, "user_balances", referrerId);
    const balanceSnap = await getDoc(balanceRef);
    if (balanceSnap.exists()) {
      const balanceData = balanceSnap.data();
      await updateDoc(balanceRef, {
        balanceUSD: newBalance,
        referralEarningsUSD: newReferralEarnings,
        totalTransactionsCount: Number(balanceData.totalTransactionsCount || 0) + 1,
        lastTransactionAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    
    await this.addBalanceTransaction({
      userId: referrerId,
      type: 'referral_bonus',
      amount: bonusAmount,
      description: 'Referral bonus',
      balanceAfter: newBalance
    });
    
    return true;
  },

  async getReferredUsers(userId: string): Promise<ReferredUser[]> {
    const colRef = collection(db, "users");
    const q = query(colRef, where("referredBy", "==", userId));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        email: data.email || '',
        username: data.username,
        createdAt: data.createdAt
      } as ReferredUser;
    });
  },

  // ===== PRODUCT LISTINGS (Admin managed) =====
  async getProductListings(category?: ProductCategory): Promise<ProductListing[]> {
    const colRef = collection(db, "product_listings");
    let q;
    
    if (category) {
      q = query(colRef, where("category", "==", category), where("isActive", "==", true), orderBy("createdAt", "desc"));
    } else {
      q = query(colRef, where("isActive", "==", true), orderBy("createdAt", "desc"));
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => {
      const data = docSnap.data() as Record<string, any>;
      return { id: docSnap.id, ...data } as ProductListing;
    });
  },

  async getAllProductListings(): Promise<ProductListing[]> {
    const colRef = collection(db, "product_listings");
    const q = query(colRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => {
      const data = docSnap.data() as Record<string, any>;
      return { id: docSnap.id, ...data } as ProductListing;
    });
  },

  async getProductById(productId: string): Promise<ProductListing | null> {
    const docRef = doc(db, "product_listings", productId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as ProductListing;
    }
    return null;
  },

  async getProductBySlug(slug: string): Promise<ProductListing | null> {
    const colRef = collection(db, "product_listings");
    const q = query(colRef, where("slug", "==", slug));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as ProductListing;
    }
    return null;
  },

  async createProductListing(product: Omit<ProductListing, 'id' | 'createdAt' | 'updatedAt'>) {
    const colRef = collection(db, "product_listings");
    const docRef = await addDoc(colRef, {
      ...product,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  },

  async updateProductListing(productId: string, data: Partial<ProductListing>) {
    const docRef = doc(db, "product_listings", productId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  },

  async deleteProductListing(productId: string) {
    const docRef = doc(db, "product_listings", productId);
    await deleteDoc(docRef);
  },

  // ===== PRODUCT ORDERS =====
  async createProductOrder(order: Omit<ProductOrder, 'id' | 'createdAt' | 'updatedAt'>) {
    const colRef = collection(db, "product_orders");
    
    // Clean the order data to remove undefined values
    const cleanOrder: any = {
      userId: order.userId,
      userEmail: order.userEmail || '',
      productId: order.productId,
      productName: order.productName,
      category: order.category,
      price: order.price,
      status: order.status,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // Only add optional fields if they have values (avoid undefined)
    if (order.username) cleanOrder.username = order.username;
    if (order.deliveryDetails) cleanOrder.deliveryDetails = order.deliveryDetails;
    if (order.adminNotes) cleanOrder.adminNotes = order.adminNotes;
    if (order.adminResponse) cleanOrder.adminResponse = order.adminResponse;
    
    // Clean requestDetails object to remove undefined values
    if (order.requestDetails) {
      const cleanRequestDetails: any = {};
      if (order.requestDetails.location) cleanRequestDetails.location = order.requestDetails.location;
      if (order.requestDetails.duration) cleanRequestDetails.duration = order.requestDetails.duration;
      if (order.requestDetails.specifications) cleanRequestDetails.specifications = order.requestDetails.specifications;
      if (order.requestDetails.additionalNotes) cleanRequestDetails.additionalNotes = order.requestDetails.additionalNotes;
      
      // Only add requestDetails if it has at least one property
      if (Object.keys(cleanRequestDetails).length > 0) {
        cleanOrder.requestDetails = cleanRequestDetails;
      }
    }
    
    const docRef = await addDoc(colRef, cleanOrder);
    const orderId = docRef.id;
    
    // Send notification for order placement
    try {
      const { userNotificationService } = await import('@/lib/user-notification-service');
      await userNotificationService.notifyOrderPlaced(
        order.userId,
        orderId,
        orderId, // Using orderId as orderNumber for now
        order.productName,
        order.category
      );
      console.log(`Order placement notification sent for order ${orderId}`);
    } catch (notificationError) {
      console.error('Failed to send order placement notification:', notificationError);
      // Don't fail the order creation if notification fails
    }
    
    return orderId;
  },

  async getUserProductOrders(userId: string): Promise<ProductOrder[]> {
    const colRef = collection(db, "product_orders");
    const q = query(colRef, where("userId", "==", userId), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductOrder));
  },

  async getAllProductOrders(): Promise<ProductOrder[]> {
    const colRef = collection(db, "product_orders");
    const q = query(colRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductOrder));
  },

  async getProductOrderById(orderId: string): Promise<ProductOrder | null> {
    const docRef = doc(db, "product_orders", orderId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as ProductOrder;
    }
    return null;
  },

  async updateProductOrder(orderId: string, data: Partial<ProductOrder>) {
    const docRef = doc(db, "product_orders", orderId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  },

  // ===== SMS ORDERS =====
  async createSMSOrder(order: Omit<SMSOrder, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    // Filter out undefined values to prevent Firestore errors
    const cleanOrder = Object.fromEntries(
      Object.entries(order).filter(([_, value]) => value !== undefined)
    );
    
    const docRef = await addDoc(collection(db, "sms_orders"), {
      ...cleanOrder,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  },

  async getSMSOrder(orderId: string): Promise<SMSOrder | null> {
    const docRef = doc(db, "sms_orders", orderId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as SMSOrder;
    }
    return null;
  },

  async getUserSMSOrders(userId: string): Promise<SMSOrder[]> {
    const colRef = collection(db, "sms_orders");
    const q = query(colRef, where("userId", "==", userId), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    } as SMSOrder));
  },

  async updateSMSOrder(orderId: string, data: Partial<SMSOrder>) {
    const docRef = doc(db, "sms_orders", orderId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  },

  async addSMSMessage(orderId: string, message: Omit<SMSMessageRecord, 'id'>) {
    const messageId = Date.now().toString();
    const smsMessage: SMSMessageRecord = {
      ...message,
      id: messageId
    };

    const order = await this.getSMSOrder(orderId);
    if (!order) throw new Error("SMS order not found");

    const updatedMessages = [...(order.smsMessages || []), smsMessage];
    await this.updateSMSOrder(orderId, { 
      smsMessages: updatedMessages,
      updatedAt: serverTimestamp()
    });

    return smsMessage;
  },

  async getActiveSMSOrders(userId: string): Promise<SMSOrder[]> {
    const orders = await this.getUserSMSOrders(userId);
    return orders.filter(order => 
      ['pending', 'awaiting_mdn', 'reserved', 'active'].includes(order.status)
    );
  },

  // ===== ATOMIC PURCHASE PRODUCT =====
  async purchaseProduct(
    userId: string, 
    productId: string, 
    requestDetails?: {
      location?: string;
      duration?: string;
      specifications?: string;
      additionalNotes?: string;
    }
  ): Promise<{ success: boolean; orderId?: string; error?: string }> {
    // 1. Pre-flight checks (Read-only)
    const profile = await this.getUserProfile(userId);
    const product = await this.getProductById(productId);

    if (!profile) return { success: false, error: "User not found" };
    if (!product) return { success: false, error: "Product not found" };
    if (!product.isActive) return { success: false, error: "Product is not available" };

    // Validate using your existing validator
    const validation = validatePurchaseRequest(userId, productId, profile.balance, product.price, requestDetails);
    if (!validation.isValid) {
      return { success: false, error: validation.errors.join('; ') };
    }

    // Prepare References
    const userRef = doc(db, "users", userId);
    const orderRef = doc(collection(db, "product_orders"));
    const transRef = doc(collection(db, "balance_transactions"));
    const userBalanceRef = doc(db, "user_balances", userId);

    try {
      const result = await runTransaction(db, async (transaction) => {
        // Double-check balance inside the transaction for concurrency safety
        const userDoc = await transaction.get(userRef);
        const userData = userDoc.data();
        if (!userData || userData.balance < product.price) {
          throw new Error("Insufficient balance at time of purchase");
        }

        const newBalance = userData.balance - product.price;
        const cleanRequestDetails = requestDetails ? cleanFirestoreData(requestDetails) : null;

        // STEP 1: Create the Order
        transaction.set(orderRef, {
          userId,
          userEmail: profile.email,
          username: profile.username || null,
          productId,
          productName: product.name,
          category: product.category,
          price: product.price,
          status: 'pending',
          requestDetails: cleanRequestDetails,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        // STEP 2: Deduct Balance
        transaction.update(userRef, {
          balance: newBalance,
          updatedAt: serverTimestamp()
        });

        // STEP 3: Record Transaction Log
        transaction.set(transRef, {
          userId,
          type: 'purchase',
          amount: -product.price,
          description: `Purchase: ${product.name}`,
          balanceAfter: newBalance,
          createdAt: serverTimestamp()
        });

        // STEP 4: Update Stats (Optional but included in transaction for consistency)
        transaction.update(userBalanceRef, {
          balanceUSD: newBalance,
          totalSpentUSD: increment(product.price),
          totalTransactionsCount: increment(1),
          lastTransactionAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        return { orderId: orderRef.id, newBalance };
      });

      // Post-transaction logic (Non-blocking)
      this.handlePostPurchaseEffects(userId, result.orderId, product.name, product.price, result.newBalance);

      return { success: true, orderId: result.orderId };

    } catch (error: any) {
      console.error(`❌ Purchase failed:`, error);
      return { 
        success: false, 
        error: error.message || "An unexpected error occurred during purchase." 
      };
    }
  },

  // Helper for non-critical side effects
  async handlePostPurchaseEffects(userId: string, orderId: string, productName: string, price: number, newBalance: number) {
    // Notify UI
    window.dispatchEvent(new CustomEvent('balanceUpdated', { 
      detail: { newBalance, deduction: price } 
    }));

    // Notify User
    try {
      const { userNotificationService } = await import('./user-notification-service');
      await userNotificationService.notifyPaymentConfirmed(userId, orderId, orderId, productName, price);
    } catch (e) {
      console.warn("Notification failed, but purchase was successful.");
    }
  },
  
  // Helper function to delete a product order (for rollback)
  async deleteProductOrder(orderId: string) {
    const docRef = doc(db, "product_orders", orderId);
    await deleteDoc(docRef);
  },

  // ===== GIFT DELIVERY INTEGRATION =====
  /**
   * Process gift purchase with address and delivery details
   * Transactional and Atomic
   */
  async purchaseGift(
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
      // 1. Dynamic Imports & Initial Data Fetching
      const { giftService } = await import('./gift-service');
      const { shippingService } = await import('./shipping-service');
      const { addressService } = await import('./address-service');

      const [profile, gift, addresses] = await Promise.all([
        this.getUserProfile(userId),
        giftService.getGiftById(giftId),
        addressService.getUserAddresses(userId)
      ]);

      const address = addresses.find(addr => addr.id === addressId);

      // 2. Pre-flight Validation
      if (!profile) return { success: false, error: "User profile not found" };
      if (!gift) return { success: false, error: "Gift not found" };
      if (!address) return { success: false, error: "Delivery address not found" };

      // 3. Calculate Total Cost
      const shippingCalculation = await shippingService.calculateShippingFee(
        { id: gift.id, title: gift.title, weight: gift.weight, sizeClass: gift.sizeClass, isFragile: gift.isFragile },
        { countryCode: address.countryCode, countryName: address.countryName, state: address.state, city: address.city, latitude: address.latitude, longitude: address.longitude }
      );

      const totalAmount = (gift.basePrice * orderDetails.quantity) + shippingCalculation.totalFee;

      if (profile.balance < totalAmount) {
        return { success: false, error: `Insufficient balance. Required: $${totalAmount.toFixed(2)}` };
      }

      // 4. Atomic Execution
      // First, create the gift record through the gift service
      const result = await giftService.processGiftPurchase(userId, giftId, addressId, orderDetails);

      if (!result.success) {
        return { success: false, error: result.error || "Gift processing failed" };
      }

      const userRef = doc(db, "users", userId);
      const transRef = doc(collection(db, "balance_transactions"));
      const userBalanceRef = doc(db, "user_balances", userId);

      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        const currentBalance = userDoc.data()?.balance || 0;

        if (currentBalance < totalAmount) {
          throw new Error("Insufficient balance at transaction time.");
        }

        const newBalance = currentBalance - totalAmount;

        // Deduct Balance
        transaction.update(userRef, {
          balance: newBalance,
          updatedAt: serverTimestamp()
        });

        // Record Transaction
        transaction.set(transRef, {
          userId,
          type: 'purchase',
          amount: -totalAmount,
          description: `Gift: ${gift.title} (${orderDetails.quantity}x) + Shipping`,
          balanceAfter: newBalance,
          createdAt: serverTimestamp()
        });

        // Update Stats
        transaction.update(userBalanceRef, {
          balanceUSD: newBalance,
          totalSpentUSD: increment(totalAmount),
          lastTransactionAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });

      // 5. Trigger UI updates
      window.dispatchEvent(new CustomEvent('balanceUpdated', { 
        detail: { newBalance: profile.balance - totalAmount } 
      }));

      return result;

    } catch (error: any) {
      console.error('Error processing gift purchase:', error);
      return {
        success: false,
        error: error.message || 'Failed to process gift purchase'
      };
    }
  }
};