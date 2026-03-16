/* eslint-disable @typescript-eslint/no-explicit-any */
import { callTellabotAPI, checkUserBalance, deductFromBalance, SMSRequestResult, SMSStatusResult, SMSMessageResult } from "./utils";
import { firestoreService } from "@/lib/firestore-service";

// One-time MDN API
export const oneTimeMdnApi = {
  // Request one-time MDN
  async requestMDN(
    userId: string,
    service: string,
    mdn?: string,
    areacode?: string,
    state?: string,
    priorityMarkup?: number
  ): Promise<SMSRequestResult> {
    // Get service details to calculate price
    const services = await balanceApi.getServices([service]);
    if (services.length === 0) {
      throw new Error('Service not found');
    }
    
    const serviceInfo = services[0];
    const basePrice = serviceInfo.basePrice;
    const markupPrice = serviceInfo.markupPrice;
    
    // Check user balance
    const { hasBalance } = await checkUserBalance(userId, markupPrice);
    if (!hasBalance) {
      throw new Error('Insufficient balance. Please top up your account.');
    }
    
    // Make API call
    const params: any = { cmd: 'request', service };
    if (mdn) params.mdn = mdn;
    if (areacode) params.areacode = areacode;
    if (state) params.state = state;
    if (priorityMarkup) params.markup = priorityMarkup;
    
    const response = await callTellabotAPI(params);
    
    if (response.status === 'error') {
      throw new Error(`Failed to request MDN: ${response.message}`);
    }
    
    if (!Array.isArray(response.message) || response.message.length === 0) {
      throw new Error('Invalid request response format');
    }
    
    const result = response.message[0];
    
    // Deduct balance
    await deductFromBalance(userId, markupPrice, `SMS Verification: ${service}`);
    
    // Create order record
    const orderId = await firestoreService.createSMSOrder({
      userId,
      userEmail: '', // Will be filled from profile
      orderType: 'one-time',
      service,
      mdn: result.mdn,
      externalId: result.id,
      status: result.status === 'Awaiting MDN' ? 'awaiting_mdn' : 
              result.status === 'Reserved' ? 'reserved' : 'pending',
      price: markupPrice,
      basePrice,
      markup: markupPrice - basePrice,
      carrier: result.carrier,
      state: result.state,
      expiresAt: null
    });
    
    return {
      id: orderId,
      mdn: result.mdn,
      service: result.service,
      status: result.status === 'Awaiting MDN' ? 'awaiting_mdn' : 
              result.status === 'Reserved' ? 'reserved' : 'pending',
      state: result.state,
      markup: result.markup || 0,
      basePrice,
      markupPrice,
      carrier: result.carrier,
      tillExpiration: result.till_expiration || 0,
      externalId: result.id
    };
  },

  // Get request status
  async getRequestStatus(externalId: string): Promise<SMSStatusResult> {
    const response = await callTellabotAPI({ cmd: 'request_status', id: externalId });
    
    if (response.status === 'error') {
      throw new Error(`Failed to get request status: ${response.message}`);
    }
    
    if (!Array.isArray(response.message) || response.message.length === 0) {
      throw new Error('Invalid status response format');
    }
    
    const result = response.message[0];
    
    return {
      id: result.id,
      mdn: result.mdn,
      service: result.service,
      status: result.status === 'Awaiting MDN' ? 'awaiting_mdn' :
              result.status === 'Reserved' ? 'reserved' :
              result.status === 'Completed' ? 'completed' :
              result.status === 'Rejected' ? 'rejected' :
              result.status === 'Timed Out' ? 'timed_out' : 'pending',
      state: result.state,
      markup: result.markup || 0,
      carrier: result.carrier,
      tillExpiration: result.till_expiration || 0
    };
  },

  // Reject MDN
  async rejectMDN(externalId: string): Promise<void> {
    const response = await callTellabotAPI({ cmd: 'reject', id: externalId });
    
    if (response.status === 'error') {
      throw new Error(`Failed to reject MDN: ${response.message}`);
    }
  },

  // Read SMS messages
  async readSMS(orderId: string, ltrId?: string, mdn?: string, service?: string): Promise<SMSMessageResult[]> {
    const params: any = { cmd: 'read_sms' };
    if (ltrId) params.ltr_id = ltrId;
    if (mdn) params.mdn = mdn;
    if (service) params.service = service;
    
    const response = await callTellabotAPI(params);
    
    if (response.status === 'error') {
      if (response.message === 'No messages') {
        return [];
      }
      throw new Error(`Failed to read SMS: ${response.message}`);
    }
    
    if (!Array.isArray(response.message)) {
      throw new Error('Invalid SMS response format');
    }
    
    // Add messages to order if orderId provided
    if (orderId) {
      for (const msg of response.message) {
        await firestoreService.addSMSMessage(orderId, {
          timestamp: msg.timestamp,
          dateTime: msg.date_time,
          from: msg.from,
          to: msg.to,
          service: msg.service,
          price: msg.price,
          reply: msg.reply,
          pin: msg.pin
        });
      }
    }
    
    return response.message.map((msg: any) => ({
      timestamp: msg.timestamp,
      dateTime: msg.date_time,
      from: msg.from,
      to: msg.to,
      service: msg.service,
      price: msg.price,
      reply: msg.reply,
      pin: msg.pin
    }));
  },

  // Send SMS reply
  async sendSMS(mdn: string, to: string, message: string): Promise<void> {
    if (message.length > 160) {
      throw new Error('SMS message cannot exceed 160 characters');
    }
    
    const response = await callTellabotAPI({
      cmd: 'send_sms',
      mdn,
      to,
      sms: message
    });
    
    if (response.status === 'error') {
      throw new Error(`Failed to send SMS: ${response.message}`);
    }
    
    // Note: SMS sending fee deduction would need to be handled by the calling function
  }
};

// Import balanceApi for service lookup
import { balanceApi } from "./balance-services";