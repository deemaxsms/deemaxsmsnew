import { ESimOrder, ESimRefill, RefillPlan, ESimRefillRequest, ESimUsageStats, ESimRefillSubmission } from '@/types/esim-types';
import { firestoreService } from '@/lib/firestore-service';
import { balanceManager } from '@/lib/balance-manager';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

class ESimService {
  // Get user's e-SIM orders from Firestore
  async getUserESimOrders(userId: string): Promise<ESimOrder[]> {
    try {
      const q = query(
        collection(db, 'esimOrders'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const orders: ESimOrder[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        orders.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt || new Date(),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt || new Date(),
          expiresAt: data.expiresAt?.toDate ? data.expiresAt.toDate() : data.expiresAt || new Date(),
          activatedAt: data.activatedAt?.toDate ? data.activatedAt.toDate() : data.activatedAt || undefined,
        } as ESimOrder);
      });
      
      return orders;
    } catch (error) {
      console.error('Error fetching e-SIM orders:', error);
      // Fallback to simulated data for development
      return this.getSimulatedESimOrders(userId);
    }
  }

  // Get active e-SIM orders that can be refilled
  async getActiveESimOrders(userId: string): Promise<ESimOrder[]> {
    const orders = await this.getUserESimOrders(userId);
    return orders.filter(order => 
      order.status === 'active' && 
      new Date(order.expiresAt) > new Date()
    );
  }

  // Get available refill plans for a specific e-SIM
  async getRefillPlans(esimOrder: ESimOrder): Promise<RefillPlan[]> {
    try {
      const q = query(
        collection(db, 'refillPlans'),
        where('region', '==', esimOrder.region),
        where('provider', '==', esimOrder.provider)
      );
      
      const querySnapshot = await getDocs(q);
      const plans: RefillPlan[] = [];
      
      querySnapshot.forEach((doc) => {
        plans.push({
          id: doc.id,
          ...doc.data()
        } as RefillPlan);
      });
      
      // If no plans found in Firestore, return simulated plans
      if (plans.length === 0) {
        return this.getSimulatedRefillPlans(esimOrder.region, esimOrder.provider);
      }
      
      return plans;
    } catch (error) {
      console.error('Error fetching refill plans:', error);
      return this.getSimulatedRefillPlans(esimOrder.region, esimOrder.provider);
    }
  }

  // Process e-SIM refill
  async processRefill(
    userId: string, 
    request: ESimRefillSubmission
  ): Promise<{ success: boolean; refillId?: string; error?: string }> {
    try {
      // Get the e-SIM order
      const esimOrder = await this.getESimOrderById(request.esimOrderId);
      if (!esimOrder) {
        return { success: false, error: 'e-SIM order not found' };
      }

      if (esimOrder.userId !== userId) {
        return { success: false, error: 'Unauthorized access' };
      }

      if (esimOrder.status !== 'active') {
        return { success: false, error: 'e-SIM is not active' };
      }

      // Get the refill plan
      const refillPlan = await this.getRefillPlanById(request.refillPlanId);
      if (!refillPlan) {
        return { success: false, error: 'Refill plan not found' };
      }

      // Process payment using balance manager
      const purchaseResult = await balanceManager.processPurchase(
        userId,
        refillPlan.price,
        `e-SIM Refill: ${refillPlan.name}`,
        request.esimOrderId
      );

      if (!purchaseResult.success) {
        return { success: false, error: purchaseResult.error };
      }

      // Create refill request in Firestore
      const refillRequestData: Omit<ESimRefillRequest, 'id'> = {
        esimOrderId: request.esimOrderId,
        userId,
        userEmail: esimOrder.userEmail,
        username: esimOrder.username,
        esimDetails: {
          iccid: esimOrder.iccid,
          provider: esimOrder.provider,
          region: esimOrder.region,
          currentDataRemaining: esimOrder.dataRemaining,
          currentExpiresAt: esimOrder.expiresAt
        },
        refillPlan: {
          id: refillPlan.id,
          name: refillPlan.name,
          dataAmount: refillPlan.dataAmount,
          validityDays: refillPlan.validityDays,
          price: refillPlan.price
        },
        refillType: request.refillType,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(collection(db, 'esimRefillRequests'), {
        ...refillRequestData,
        createdAt: Timestamp.fromDate(refillRequestData.createdAt),
        updatedAt: Timestamp.fromDate(refillRequestData.updatedAt),
        esimDetails: {
          ...refillRequestData.esimDetails,
          currentExpiresAt: Timestamp.fromDate(refillRequestData.esimDetails.currentExpiresAt)
        }
      });

      return { success: true, refillId: docRef.id };

    } catch (error) {
      console.error('Error processing refill:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to process refill' 
      };
    }
  }

  // Get usage statistics for an e-SIM
  getUsageStats(esimOrder: ESimOrder): ESimUsageStats {
    const totalData = esimOrder.totalDataMB;
    const usedData = esimOrder.dataUsed;
    const remainingData = esimOrder.dataRemaining;
    const dataUsagePercentage = totalData > 0 ? (usedData / totalData) * 100 : 0;
    
    const now = new Date();
    const expiresAt = new Date(esimOrder.expiresAt);
    const daysRemaining = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    
    return {
      totalData,
      usedData,
      remainingData,
      dataUsagePercentage,
      daysRemaining,
      isExpiringSoon: daysRemaining <= 3,
      isLowData: dataUsagePercentage >= 90
    };
  }

  // Admin: Get all refill requests
  async getAllRefillRequests(): Promise<ESimRefillRequest[]> {
    try {
      const q = query(
        collection(db, 'esimRefillRequests'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const requests: ESimRefillRequest[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        requests.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt || new Date(),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt || new Date(),
          processedAt: data.processedAt?.toDate ? data.processedAt.toDate() : data.processedAt || undefined,
          esimDetails: {
            ...data.esimDetails,
            currentExpiresAt: data.esimDetails?.currentExpiresAt?.toDate ? data.esimDetails.currentExpiresAt.toDate() : data.esimDetails?.currentExpiresAt || new Date()
          }
        } as ESimRefillRequest);
      });
      
      return requests;
    } catch (error) {
      console.error('Error fetching refill requests:', error);
      return [];
    }
  }

  // Admin: Approve refill request
  async approveRefillRequest(
    requestId: string, 
    adminId: string, 
    adminNotes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const requestRef = doc(db, 'esimRefillRequests', requestId);
      const requestDoc = await getDoc(requestRef);
      
      if (!requestDoc.exists()) {
        return { success: false, error: 'Refill request not found' };
      }

      const requestData = requestDoc.data() as ESimRefillRequest;
      
      if (requestData.status !== 'pending') {
        return { success: false, error: 'Request is not pending' };
      }

      // Update request status
      await updateDoc(requestRef, {
        status: 'approved',
        processedBy: adminId,
        processedAt: Timestamp.fromDate(new Date()),
        adminNotes: adminNotes || '',
        updatedAt: Timestamp.fromDate(new Date())
      });

      // Process the actual refill
      await this.processApprovedRefill(requestData);

      return { success: true };
    } catch (error) {
      console.error('Error approving refill request:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to approve refill' 
      };
    }
  }

  // Admin: Reject refill request
  async rejectRefillRequest(
    requestId: string, 
    adminId: string, 
    adminNotes: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const requestRef = doc(db, 'esimRefillRequests', requestId);
      const requestDoc = await getDoc(requestRef);
      
      if (!requestDoc.exists()) {
        return { success: false, error: 'Refill request not found' };
      }

      const requestData = requestDoc.data() as ESimRefillRequest;
      
      if (requestData.status !== 'pending') {
        return { success: false, error: 'Request is not pending' };
      }

      // Update request status
      await updateDoc(requestRef, {
        status: 'rejected',
        processedBy: adminId,
        processedAt: Timestamp.fromDate(new Date()),
        adminNotes,
        updatedAt: Timestamp.fromDate(new Date())
      });

      // Refund the user
      await balanceManager.processRefund(
        requestData.userId,
        requestData.refillPlan.price,
        'e-SIM Refill Rejected - Refund',
        requestId
      );

      return { success: true };
    } catch (error) {
      console.error('Error rejecting refill request:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to reject refill' 
      };
    }
  }

  // Private helper methods

  private async getESimOrderById(orderId: string): Promise<ESimOrder | null> {
    try {
      const docRef = doc(db, 'esimOrders', orderId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt && typeof data.createdAt === 'object' && 'toDate' in data.createdAt ? (data.createdAt as any).toDate() : data.createdAt || new Date(),
          updatedAt: data.updatedAt && typeof data.updatedAt === 'object' && 'toDate' in data.updatedAt ? (data.updatedAt as any).toDate() : data.updatedAt || new Date(),
          expiresAt: data.expiresAt && typeof data.expiresAt === 'object' && 'toDate' in data.expiresAt ? (data.expiresAt as any).toDate() : data.expiresAt || new Date(),
          activatedAt: data.activatedAt && typeof data.activatedAt === 'object' && 'toDate' in data.activatedAt ? (data.activatedAt as any).toDate() : data.activatedAt || undefined,
        } as ESimOrder;
      }
      
      // Fallback to simulated data
      const orders = this.getSimulatedESimOrders('user123');
      return orders.find(order => order.id === orderId) || null;
    } catch (error) {
      console.error('Error fetching e-SIM order:', error);
      return null;
    }
  }

  private async getRefillPlanById(planId: string): Promise<RefillPlan | null> {
    try {
      const docRef = doc(db, 'refillPlans', planId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as RefillPlan;
      }
      
      // Fallback to simulated data
      const plans = this.getSimulatedRefillPlans('Global', 'Airalo');
      return plans.find(plan => plan.id === planId) || null;
    } catch (error) {
      console.error('Error fetching refill plan:', error);
      return null;
    }
  }

  private async processApprovedRefill(request: ESimRefillRequest): Promise<void> {
    try {
      // Get the e-SIM order
      const esimOrderRef = doc(db, 'esimOrders', request.esimOrderId);
      const esimOrderDoc = await getDoc(esimOrderRef);
      
      if (!esimOrderDoc.exists()) {
        throw new Error('e-SIM order not found');
      }

      const esimOrder = esimOrderDoc.data() as ESimOrder;
      
      // Update e-SIM order with refill data
      const updates: any = {
        updatedAt: Timestamp.fromDate(new Date())
      };

      if (request.refillType === 'data' || request.refillType === 'both') {
        const additionalData = request.refillPlan.dataAmount || 0;
        updates.dataRemaining = esimOrder.dataRemaining + additionalData;
        updates.totalDataMB = esimOrder.totalDataMB + additionalData;
      }

      if (request.refillType === 'validity' || request.refillType === 'both') {
        const currentExpiry = esimOrder.expiresAt instanceof Date 
          ? esimOrder.expiresAt 
          : (esimOrder.expiresAt as any).toDate ? (esimOrder.expiresAt as any).toDate() : new Date(esimOrder.expiresAt);
        const additionalDays = request.refillPlan.validityDays || 0;
        const newExpiry = new Date(currentExpiry);
        newExpiry.setDate(newExpiry.getDate() + additionalDays);
        updates.expiresAt = Timestamp.fromDate(newExpiry);
      }

      await updateDoc(esimOrderRef, updates);

      // Mark refill request as completed
      const requestRef = doc(db, 'esimRefillRequests', request.id);
      await updateDoc(requestRef, {
        status: 'completed',
        updatedAt: Timestamp.fromDate(new Date())
      });

    } catch (error) {
      console.error('Error processing approved refill:', error);
      throw error;
    }
  }

  // Simulation methods (for development/fallback)
  private getSimulatedESimOrders(userId: string): ESimOrder[] {
    return [
      {
        id: 'esim_001',
        userId,
        userEmail: 'user@example.com',
        username: 'user123',
        iccid: '8944501234567890123',
        phoneNumber: '+1234567890',
        provider: 'Airalo',
        region: 'Global',
        dataAllowance: '5GB',
        validityPeriod: '30 days',
        price: 15.00,
        status: 'active',
        activatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        dataUsed: 2048,
        dataRemaining: 3072,
        totalDataMB: 5120,
        qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        activationCode: 'ACT123456789',
        refillHistory: [],
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      },
      {
        id: 'esim_002',
        userId,
        userEmail: 'user@example.com',
        username: 'user123',
        iccid: '8944501234567890124',
        provider: 'Nomad',
        region: 'Europe',
        dataAllowance: '10GB',
        validityPeriod: '30 days',
        price: 25.00,
        status: 'active',
        activatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        dataUsed: 9216,
        dataRemaining: 1024,
        totalDataMB: 10240,
        qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        activationCode: 'ACT987654321',
        refillHistory: [],
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      }
    ];
  }

  private getSimulatedRefillPlans(region: string, provider: string): RefillPlan[] {
    return [
      {
        id: 'plan_data_1gb',
        name: '1GB Data Top-up',
        description: 'Add 1GB of data to your existing plan',
        dataAmount: 1024,
        price: 5.00,
        region,
        provider,
        type: 'data-only'
      },
      {
        id: 'plan_data_3gb',
        name: '3GB Data Top-up',
        description: 'Add 3GB of data to your existing plan',
        dataAmount: 3072,
        price: 12.00,
        region,
        provider,
        type: 'data-only',
        isPopular: true
      },
      {
        id: 'plan_data_5gb',
        name: '5GB Data Top-up',
        description: 'Add 5GB of data to your existing plan',
        dataAmount: 5120,
        price: 18.00,
        region,
        provider,
        type: 'data-only'
      },
      {
        id: 'plan_validity_7d',
        name: '7 Days Extension',
        description: 'Extend your plan validity by 7 days',
        validityDays: 7,
        price: 3.00,
        region,
        provider,
        type: 'validity-only'
      },
      {
        id: 'plan_validity_30d',
        name: '30 Days Extension',
        description: 'Extend your plan validity by 30 days',
        validityDays: 30,
        price: 8.00,
        region,
        provider,
        type: 'validity-only'
      },
      {
        id: 'plan_combo_2gb_15d',
        name: '2GB + 15 Days',
        description: 'Add 2GB data and extend validity by 15 days',
        dataAmount: 2048,
        validityDays: 15,
        price: 15.00,
        region,
        provider,
        type: 'data-and-validity',
        isPopular: true
      }
    ];
  }
}

export const esimService = new ESimService();