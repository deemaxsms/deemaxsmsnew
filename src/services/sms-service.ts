/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  SMSNumber,
  NumberRequest,
  Service,
} from '../types/sms-types';
import { tellabotApi } from './tellabot-api'; // ← Correct import name
import { smsPricingService } from './sms-pricing-service';
import { smsSessionService } from './sms-session-service';
import { firestoreService, SMSOrder, SMSOrderStatus } from '../lib/firestore-service';
import { balanceManager } from '../lib/balance-manager';

class SMSService {
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();

  // Get available services with pricing
  async getServices(): Promise<Array<Service & { finalPrice: number; rentalPrices: Record<string, number> }>> {
    return await smsPricingService.getAllServicesWithPricing();
  }

  // No countries or states needed — Tell A Bot only supports US numbers
  // These methods are kept for compatibility but return minimal data
  async getUSStates(): Promise<any[]> {
    return []; // Not used — geo-targeting is optional via state/areacode
  }

  async getAreaCodesForState(stateCode: string): Promise<string[]> {
    return []; // Not supported directly — user can enter any valid area code
  }

  async getCountries(): Promise<any[]> {
    return [{ country: 'United States', iso2: 'US', countryCode: '+1' }];
  }

  // Optional validation for state/area code (basic check)
  async validateTargeting(state?: string, areaCode?: string): Promise<{ valid: boolean; error?: string }> {
    if (state && !/^[A-Z]{2}$/.test(state.toUpperCase())) {
      return { valid: false, error: 'Invalid US state code (must be 2 letters)' };
    }
    if (areaCode && !/^\d{3}$/.test(areaCode)) {
      return { valid: false, error: 'Invalid area code (must be 3 digits)' };
    }
    return { valid: true };
  }

  // Get service with pricing
  async getServicePricing(serviceName: string) {
    return await smsPricingService.getServiceWithPricing(serviceName);
  }

  // Get user's SMS orders
  async getUserOrders(userId: string) {
    return await firestoreService.getUserSMSOrders(userId);
  }

  // Order a new SMS number
  async orderNumber(request: NumberRequest, userId: string): Promise<{ success: boolean; orderId?: string; error?: string }> {
    try {
      // Validate targeting
      const validation = await this.validateTargeting(request.state, request.areaCode);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Determine if this is long-term or one-time
      const isLongTerm = request.type === 'rental' && request.rentalDuration;

      // Get pricing
      const serviceWithPricing = await smsPricingService.getServiceWithPricing(request.service);
      if (!serviceWithPricing) {
        return { success: false, error: 'Service not found or pricing unavailable' };
      }

      const finalPrice = isLongTerm
        ? serviceWithPricing.rentalPrices[request.rentalDuration!.toString()] || serviceWithPricing.finalPrice
        : serviceWithPricing.finalPrice;

      // Process payment
      const purchaseResult = await balanceManager.processPurchase(
        userId,
        finalPrice,
        `SMS Number: ${request.service} (${isLongTerm ? `${request.rentalDuration} days` : 'one-time'})`,
        undefined
      );

      if (!purchaseResult.success) {
        return { success: false, error: purchaseResult.error };
      }

      let orderResponse: any;

      try {
        if (isLongTerm) {
          // Long-term rental
          orderResponse = await tellabotApi.rentLongTerm(request.service, {
            duration: request.rentalDuration as 3 | 30,
            state: request.state,
            areacode: request.areaCode,
            mdn: request.mdn,
          });
        } else {
          // One-time request
          const result = await tellabotApi.requestNumber(request.service, {
            state: request.state,
            areacode: request.areaCode,
            mdn: request.mdn,
            markup: request.markup,
          });
          orderResponse = result[0]; // API returns array
        }
      } catch (apiError: any) {
        // Refund on API failure
        await balanceManager.processRefund(userId, finalPrice, 'Tell A Bot API Error');
        return { success: false, error: apiError.message || 'Failed to contact Tell A Bot' };
      }

      // Calculate expiry
      let expiresAt = new Date();
      if (isLongTerm) {
        expiresAt.setDate(expiresAt.getDate() + (request.rentalDuration || 30));
      } else {
        expiresAt.setSeconds(expiresAt.getSeconds() + (orderResponse.till_expiration || 900));
      }

      // Get user profile
      const userProfile = await firestoreService.getUserProfile(userId);
      if (!userProfile) {
        await balanceManager.processRefund(userId, finalPrice, 'User profile missing');
        return { success: false, error: 'User profile not found' };
      }

      // Create order in Firestore
      const smsOrder: Omit<SMSOrder, 'id' | 'createdAt' | 'updatedAt'> = {
        userId,
        userEmail: userProfile.email,
        username: userProfile.username || userProfile.displayName || userProfile.email.split('@')[0],
        orderType: isLongTerm ? 'long-term' : 'one-time',
        service: request.service,
        mdn: orderResponse.mdn || '',
        externalId: isLongTerm ? orderResponse.id.toString() : orderResponse.id,
        status: this.mapTellaBotStatus(
          isLongTerm ? 'online' : (orderResponse.status || 'Awaiting MDN')
        ),
        price: finalPrice,
        basePrice: parseFloat(isLongTerm ? (serviceWithPricing.ltr_price || serviceWithPricing.price).toString() : serviceWithPricing.price.toString()),
        markup: finalPrice - parseFloat((isLongTerm ? serviceWithPricing.ltr_price || serviceWithPricing.price : serviceWithPricing.price).toString()),
        expiresAt,
        duration: request.rentalDuration,
        smsMessages: [],
      };

      const orderId = await firestoreService.createSMSOrder(smsOrder);

      // Create session number
      const smsNumber: SMSNumber = {
        id: orderId,
        number: orderResponse.mdn || '',
        country: 'US',
        countryCode: '+1',
        service: request.service,
        price: finalPrice,
        status: this.mapSMSNumberStatus(smsOrder.status),
        createdAt: new Date(),
        expiresAt,
        messages: [],
        type: request.type,
        rentalDuration: request.rentalDuration,
        state: request.state,
        areaCode: request.areaCode,
        carrier: orderResponse.carrier,
        markup: request.markup,
        tillExpiration: orderResponse.till_expiration,
      };

      smsSessionService.addActiveNumber(smsNumber);

      // Start polling for messages (one-time only — long-term can be handled separately)
      if (!isLongTerm && orderResponse.status === 'Reserved') {
        this.startPolling(orderId, orderResponse.id, userId);
      }

      return { success: true, orderId };
    } catch (error: any) {
      console.error('Error in orderNumber:', error);
      return { success: false, error: error.message || 'Unknown error' };
    }
  }

  private mapTellaBotStatus(tellaBotStatus: string): SMSOrderStatus {
    const map: Record<string, SMSOrderStatus> = {
      'Awaiting MDN': 'awaiting_mdn',
      'Reserved': 'reserved',
      'Completed': 'completed',
      'Rejected': 'rejected',
      'Timed Out': 'timed_out',
      'online': 'active',
      'offline': 'expired',
      'awaiting mdn': 'awaiting_mdn',
    };
    return map[tellaBotStatus] || 'pending';
  }

  private mapSMSNumberStatus(smsOrderStatus: SMSOrderStatus): 'active' | 'waiting' | 'completed' | 'cancelled' {
    const map: Record<SMSOrderStatus, 'active' | 'waiting' | 'completed' | 'cancelled'> = {
      'pending': 'waiting',
      'awaiting_mdn': 'waiting',
      'reserved': 'active',
      'active': 'active',
      'completed': 'completed',
      'rejected': 'cancelled',
      'timed_out': 'cancelled',
      'cancelled': 'cancelled',
      'expired': 'cancelled',
    };
    return map[smsOrderStatus] || 'waiting';
  }

  private startPolling(orderId: string, externalId: string, userId: string): void {
    if (this.pollingIntervals.has(orderId)) return;

    const interval = setInterval(async () => {
      try {
        const messages = await tellabotApi.readSMS({ id: externalId });

        if (messages.length > 0) {
          const formattedMessages = messages.map((m) => ({
            id: `${externalId}_${m.timestamp}`,
            timestamp: m.timestamp,
            dateTime: m.date_time,
            from: m.from,
            to: m.to,
            service: m.service,
            price: m.price,
            reply: m.reply,
            pin: m.pin,
            receivedAt: new Date(m.timestamp * 1000),
          }));

          await firestoreService.updateSMSOrder(orderId, {
            smsMessages: formattedMessages,
            status: 'completed',
          });

          this.stopPolling(orderId); // Stop after receiving SMS
        }

        // Also check status
        const status = await tellabotApi.getRequestStatus(externalId);
        if (status.status === 'Timed Out' || status.status === 'Rejected') {
          await firestoreService.updateSMSOrder(orderId, {
            status: this.mapTellaBotStatus(status.status),
          });
          this.stopPolling(orderId);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 10000);

    this.pollingIntervals.set(orderId, interval);

    // Auto-stop after 30 minutes
    setTimeout(() => this.stopPolling(orderId), 30 * 60 * 1000);
  }

  private stopPolling(orderId: string) {
    const interval = this.pollingIntervals.get(orderId);
    if (interval) {
      clearInterval(interval);
      this.pollingIntervals.delete(orderId);
    }
  }

  async initializePolling(userId: string) {
    const activeOrders = await firestoreService.getActiveSMSOrders(userId);
    for (const order of activeOrders) {
      if (order.externalId && order.orderType === 'one-time') {
        this.startPolling(order.id, order.externalId, userId);
      }
    }
  }

  async cancelOrder(orderId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const order = await firestoreService.getSMSOrder(orderId);
      if (!order || order.userId !== userId) {
        return { success: false, error: 'Order not found' };
      }

      if (order.externalId && order.orderType === 'one-time') {
        await tellabotApi.rejectRequest(order.externalId);
      }

      await firestoreService.updateSMSOrder(orderId, { status: 'cancelled' });
      this.stopPolling(orderId);

      // Refund only if not used
      if (order.status === 'pending' || order.status === 'awaiting_mdn' || !order.smsMessages.length) {
        await balanceManager.processRefund(userId, order.price, 'SMS Order Cancelled');
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Long-term features (basic stubs — extend later if needed)
  async extendRental(orderId: string, days: number, userId: string) {
    return { success: false, error: 'Rental extension not yet supported' };
  }

  async sendSMSReply(mdn: string, to: string, message: string, userId: string) {
    try {
      await tellabotApi.sendReply(mdn, to, message);
      return { success: true };
    } catch {
      return { success: false, error: 'Failed to send reply' };
    }
  }

  async getActiveOrders(userId: string): Promise<SMSOrder[]> {
    return await firestoreService.getActiveSMSOrders(userId);
  }

  cleanup() {
    for (const interval of this.pollingIntervals.values()) {
      clearInterval(interval);
    }
    this.pollingIntervals.clear();
  }
}

export const smsService = new SMSService();