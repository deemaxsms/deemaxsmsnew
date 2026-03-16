/* eslint-disable @typescript-eslint/no-explicit-any */
import { tellabotApi, SMSService, SMSRequestResult, LTRResult, SMSMessage as ApiSMSMessage } from "./tellabot-api";
import { firestoreService, SMSOrder, SMSOrderStatus } from "./firestore-service";

export interface PurchaseSMSResult {
  success: boolean;
  orderId?: string;
  mdn?: string;
  status: SMSOrderStatus;
  error?: string;
}

export interface SMSOrderWithMessages extends SMSOrder {
  messages: ApiSMSMessage[];
}

export const smsService = {
  // Get available services with markup pricing
  async getServices(): Promise<SMSService[]> {
    return tellabotApi.getServices();
  },

  // Get provider balance (admin only)
  async getProviderBalance(): Promise<number> {
    return tellabotApi.getBalance();
  },

  // Purchase one-time SMS number
  async purchaseOneTimeSMS(
    userId: string,
    userEmail: string,
    username: string | undefined,
    service: string,
    markupPrice: number,
    basePrice: number
  ): Promise<PurchaseSMSResult> {
    try {
      // Check user balance first
      const profile = await firestoreService.getUserProfile(userId);
      if (!profile) {
        return { success: false, status: "cancelled", error: "User not found" };
      }

      if (profile.balance < markupPrice) {
        return { success: false, status: "cancelled", error: "Insufficient balance. Please top up your account." };
      }

      // Request MDN from TellaBot
      const result = await tellabotApi.requestMDN(service);

      // Create order in Firestore
      const orderId = await firestoreService.createSMSOrder({
        userId,
        userEmail,
        username,
        orderType: "one-time",
        service,
        mdn: result.mdn || undefined,
        externalId: result.externalId,
        status: result.status as SMSOrderStatus,
        price: markupPrice,
        basePrice,
        markup: markupPrice - basePrice,
        carrier: result.carrier,
        state: result.state,
      });

      // Deduct balance
      const newBalance = profile.balance - markupPrice;
      await firestoreService.updateUserBalance(userId, newBalance);

      // Record transaction
      await firestoreService.addBalanceTransaction({
        userId,
        type: "purchase",
        amount: -markupPrice,
        description: `SMS Number: ${service}`,
        balanceAfter: newBalance,
      });

      return {
        success: true,
        orderId,
        mdn: result.mdn || undefined,
        status: result.status as SMSOrderStatus,
      };
    } catch (error: any) {
      console.error("Error purchasing one-time SMS:", error);
      return { success: false, status: "cancelled", error: error.message || "Failed to purchase SMS number" };
    }
  },

  // Purchase long-term rental
  async purchaseLTR(
    userId: string,
    userEmail: string,
    username: string | undefined,
    service: string,
    duration: 3 | 7 | 14 | 30,
    markupPrice: number,
    basePrice: number
  ): Promise<PurchaseSMSResult> {
    try {
      // Check user balance
      const profile = await firestoreService.getUserProfile(userId);
      if (!profile) {
        return { success: false, status: "cancelled", error: "User not found" };
      }

      if (profile.balance < markupPrice) {
        return { success: false, status: "cancelled", error: "Insufficient balance. Please top up your account." };
      }

      // Rent from TellaBot
      const result = await tellabotApi.rentLTR(service, duration);

      // Create order
      const orderId = await firestoreService.createSMSOrder({
        userId,
        userEmail,
        username,
        orderType: "long-term",
        service,
        mdn: result.mdn || undefined,
        externalId: result.externalId,
        status: result.mdn ? "active" : "awaiting_mdn",
        price: markupPrice,
        basePrice,
        markup: markupPrice - basePrice,
        carrier: result.carrier,
        duration,
        autoRenew: false,
      });

      // Deduct balance
      const newBalance = profile.balance - markupPrice;
      await firestoreService.updateUserBalance(userId, newBalance);

      // Record transaction
      await firestoreService.addBalanceTransaction({
        userId,
        type: "purchase",
        amount: -markupPrice,
        description: `LTR ${duration} days: ${service}`,
        balanceAfter: newBalance,
      });

      return {
        success: true,
        orderId,
        mdn: result.mdn || undefined,
        status: result.mdn ? "active" : "awaiting_mdn",
      };
    } catch (error: any) {
      console.error("Error purchasing LTR:", error);
      return { success: false, status: "cancelled", error: error.message || "Failed to rent number" };
    }
  },

  // Check order status and update
  async refreshOrderStatus(orderId: string): Promise<SMSOrder | null> {
    const order = await firestoreService.getSMSOrder(orderId);
    if (!order) return null;

    try {
      if (order.orderType === "one-time") {
        const status = await tellabotApi.getRequestStatus(order.externalId);
        await firestoreService.updateSMSOrder(orderId, {
          status: status.status as SMSOrderStatus,
          mdn: status.mdn || order.mdn,
          carrier: status.carrier || order.carrier,
        });
      } else {
        const status = await tellabotApi.getLTRStatus({ ltr_id: order.externalId });
        let newStatus: SMSOrderStatus = order.status;
        if (status.ltrStatus === "online") newStatus = "active";
        else if (status.ltrStatus === "offline") newStatus = "completed";
        else if (status.ltrStatus === "awaiting_mdn") newStatus = "awaiting_mdn";

        await firestoreService.updateSMSOrder(orderId, {
          status: newStatus,
          mdn: status.mdn || order.mdn,
        });
      }

      return await firestoreService.getSMSOrder(orderId);
    } catch (error) {
      console.error("Error refreshing order status:", error);
      return order;
    }
  },

  // Get SMS messages for an order
  async getMessages(order: SMSOrder): Promise<ApiSMSMessage[]> {
    try {
      let messages: ApiSMSMessage[];

      if (order.orderType === "one-time") {
        messages = await tellabotApi.readSMS({ id: order.externalId });
      } else {
        messages = await tellabotApi.readSMS({ ltr_id: order.externalId });
      }

      // Store messages in Firestore for history
      for (const msg of messages) {
        const existingMessages = order.smsMessages || [];
        const alreadyExists = existingMessages.some(
          (m) => m.timestamp === msg.timestamp && m.from === msg.from
        );
        if (!alreadyExists) {
          await firestoreService.addSMSMessage(order.id, {
            timestamp: msg.timestamp,
            dateTime: msg.dateTime,
            from: msg.from,
            to: msg.to,
            service: msg.service,
            price: msg.price,
            reply: msg.text,
            pin: msg.pin,
          });
        }
      }

      return messages;
    } catch (error) {
      console.error("Error getting messages:", error);
      return [];
    }
  },

  // Cancel/reject an order
  async cancelOrder(orderId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const order = await firestoreService.getSMSOrder(orderId);
      if (!order) {
        return { success: false, error: "Order not found" };
      }

      if (order.orderType === "one-time") {
        await tellabotApi.rejectMDN(order.externalId);
      } else {
        await tellabotApi.releaseLTR({ ltr_id: order.externalId });
      }

      await firestoreService.updateSMSOrder(orderId, { status: "cancelled" });

      // Note: No refund is given for cancelled orders based on TellaBot policy
      return { success: true };
    } catch (error: any) {
      console.error("Error cancelling order:", error);
      return { success: false, error: error.message || "Failed to cancel order" };
    }
  },

  // Activate LTR to bring online
  async activateLTR(orderId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const order = await firestoreService.getSMSOrder(orderId);
      if (!order || !order.mdn) {
        return { success: false, error: "Order not found or no MDN assigned" };
      }

      await tellabotApi.activateLTR(order.mdn);
      await firestoreService.updateSMSOrder(orderId, { status: "active" });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Toggle auto-renew
  async setAutoRenew(orderId: string, autoRenew: boolean): Promise<{ success: boolean; error?: string }> {
    try {
      const order = await firestoreService.getSMSOrder(orderId);
      if (!order) {
        return { success: false, error: "Order not found" };
      }

      await tellabotApi.setAutoRenew({ ltr_id: order.externalId }, autoRenew);
      await firestoreService.updateSMSOrder(orderId, { autoRenew });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Report MDN as non-working
  async reportMDN(orderId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const order = await firestoreService.getSMSOrder(orderId);
      if (!order || !order.mdn) {
        return { success: false, error: "Order not found or no MDN" };
      }

      await tellabotApi.reportMDN(order.mdn);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};
