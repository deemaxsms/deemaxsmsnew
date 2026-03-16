/* eslint-disable @typescript-eslint/no-explicit-any */
import { callTellabotAPI, checkUserBalance, deductFromBalance, LTRRentResult, LTRStatusResult } from "./utils";
import { firestoreService } from "@/lib/firestore-service";

// Long-term MDN Rentals API
export const longTermRentalApi = {
  // Rent long-term MDN
  async rentLTR(
    userId: string,
    service: string,
    duration: 3 | 30 = 30,
    mdn?: string,
    areacode?: string,
    state?: string,
    autoRenew?: boolean
  ): Promise<LTRRentResult> {
    // Get service details
    const services = await balanceApi.getServices([service]);
    if (services.length === 0) {
      throw new Error('Service not found');
    }
    
    const serviceInfo = services[0];
    const basePrice = duration === 3 ? (serviceInfo.ltrShortPrice || serviceInfo.ltrPrice || 0) : (serviceInfo.ltrPrice || 0);
    const markupPrice = duration === 3 ? (serviceInfo.ltrShortMarkupPrice || serviceInfo.ltrMarkupPrice || 0) : (serviceInfo.ltrMarkupPrice || 0);
    
    if (basePrice === 0) {
      throw new Error('Service pricing not available');
    }
    
    // Check balance
    const { hasBalance } = await checkUserBalance(userId, markupPrice);
    if (!hasBalance) {
      throw new Error('Insufficient balance. Please top up your account.');
    }
    
    // Make API call
    const params: any = { cmd: 'ltr_rent', service, duration };
    if (mdn) params.mdn = mdn;
    if (areacode) params.areacode = areacode;
    if (state) params.state = state;
    if (autoRenew) params.autorenew = 'true';
    
    const response = await callTellabotAPI(params);
    
    if (response.status === 'error') {
      throw new Error(`Failed to rent long-term MDN: ${response.message}`);
    }
    
    const result = response.message;
    
    // Deduct balance
    await deductFromBalance(userId, markupPrice, `Long-term SMS Rental: ${service} (${duration} days)`);
    
    // Calculate expiration date
    const expiresAt = new Date(result.expires);
    
    // Create order record
    const orderId = await firestoreService.createSMSOrder({
      userId,
      userEmail: '', // Will be filled from profile
      orderType: 'long-term',
      service,
      mdn: result.mdn,
      externalId: result.id,
      status: 'active',
      price: markupPrice,
      basePrice,
      markup: markupPrice - basePrice,
      carrier: result.carrier,
      expiresAt,
      autoRenew,
      duration
    });
    
    return {
      id: orderId,
      mdn: result.mdn,
      service: result.service,
      basePrice,
      markupPrice,
      expires: result.expires,
      carrier: result.carrier,
      externalId: result.id
    };
  },

  // Get long-term rental status
  async getLTRStatus(ltrId?: string, mdn?: string): Promise<LTRStatusResult> {
    const params: any = { cmd: 'ltr_status' };
    if (ltrId) params.ltr_id = ltrId;
    if (mdn) params.mdn = mdn;
    
    const response = await callTellabotAPI(params);
    
    if (response.status === 'error') {
      throw new Error(`Failed to get LTR status: ${response.message}`);
    }
    
    const result = response.message;
    
    return {
      ltrStatus: result.ltr_status,
      mdn: result.mdn,
      tillChange: result.till_change || 0,
      nextOnline: result.next_online || 0,
      timestamp: result.timestamp || 0,
      dateTime: result.date_time || ''
    };
  },

  // Activate long-term rental
  async activateLTR(mdn: string): Promise<LTRStatusResult> {
    const response = await callTellabotAPI({ cmd: 'ltr_activate', mdn });
    
    if (response.status === 'error') {
      throw new Error(`Failed to activate LTR: ${response.message}`);
    }
    
    return response.message;
  },

  // Release long-term rental
  async releaseLTR(ltrId?: string, mdn?: string, service?: string): Promise<void> {
    const params: any = { cmd: 'ltr_release' };
    if (ltrId) params.ltr_id = ltrId;
    if (mdn) params.mdn = mdn;
    if (service) params.service = service;
    
    const response = await callTellabotAPI(params);
    
    if (response.status === 'error') {
      throw new Error(`Failed to release LTR: ${response.message}`);
    }
  },

  // Change auto-renew status
  async setLTRAutoRenew(ltrId: string, service: string, mdn: string, autoRenew: boolean): Promise<void> {
    const params: any = { cmd: 'ltr_autorenew', autorenew: autoRenew.toString() };
    if (ltrId) params.ltr_id = ltrId;
    if (service) params.service = service;
    if (mdn) params.mdn = mdn;
    
    const response = await callTellabotAPI(params);
    
    if (response.status === 'error') {
      throw new Error(`Failed to set auto-renew: ${response.message}`);
    }
  },

  // Report MDN as non-working
  async reportMDN(mdn: string): Promise<void> {
    const response = await callTellabotAPI({ cmd: 'ltr_report', mdn });
    
    if (response.status === 'error') {
      throw new Error(`Failed to report MDN: ${response.message}`);
    }
  },

  // Get reported MDN status
  async getReportedMDNStatus(mdn: string): Promise<string> {
    const response = await callTellabotAPI({ cmd: 'ltr_reported_status', mdn });
    
    if (response.status === 'error') {
      return response.message;
    }
    
    return 'ok';
  },

  // Switch service for unlimited rental
  async switchLTRService(service: string, mdn: string, ltrId?: string): Promise<void> {
    const params: any = { cmd: 'ltr_switch_service', service };
    if (ltrId) params.ltr_id = ltrId;
    if (mdn) params.mdn = mdn;
    
    const response = await callTellabotAPI(params);
    
    if (response.status === 'error') {
      throw new Error(`Failed to switch service: ${response.message}`);
    }
  },

  // Set up voice call forwarding
  async setupLTRForwarding(ltrId: string, mdn: string, service: string, destination: string): Promise<void> {
    const params: any = { cmd: 'ltr_forward', destination };
    if (ltrId) params.ltr_id = ltrId;
    if (mdn) params.mdn = mdn;
    if (service) params.service = service;
    
    const response = await callTellabotAPI(params);
    
    if (response.status === 'error') {
      throw new Error(`Failed to set up forwarding: ${response.message}`);
    }
  }
};

// Import balanceApi for service lookup
import { balanceApi } from "./balance-services";