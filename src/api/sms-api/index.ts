// SMS API - Main exports
export * from "./utils";
export * from "./balance-services";
export * from "./one-time-mdn";
export * from "./long-term-rental";

// Combined SMS API service
import { balanceApi } from "./balance-services";
import { oneTimeMdnApi } from "./one-time-mdn";
import { longTermRentalApi } from "./long-term-rental";

export const smsApi = {
  // Balance & Services
  getTellabotBalance: balanceApi.getTellabotBalance,
  getServices: balanceApi.getServices,

  // One-time MDNs
  requestMDN: oneTimeMdnApi.requestMDN,
  getRequestStatus: oneTimeMdnApi.getRequestStatus,
  rejectMDN: oneTimeMdnApi.rejectMDN,
  readSMS: oneTimeMdnApi.readSMS,
  sendSMS: oneTimeMdnApi.sendSMS,

  // Long-term Rentals
  rentLTR: longTermRentalApi.rentLTR,
  getLTRStatus: longTermRentalApi.getLTRStatus,
  activateLTR: longTermRentalApi.activateLTR,
  releaseLTR: longTermRentalApi.releaseLTR,
  setLTRAutoRenew: longTermRentalApi.setLTRAutoRenew,
  reportMDN: longTermRentalApi.reportMDN,
  getReportedMDNStatus: longTermRentalApi.getReportedMDNStatus,
  switchLTRService: longTermRentalApi.switchLTRService,
  setupLTRForwarding: longTermRentalApi.setupLTRForwarding,
};