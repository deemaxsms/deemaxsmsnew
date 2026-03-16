/* eslint-disable @typescript-eslint/no-explicit-any */

const TELLABOT_BASE_URL = "https://www.tellabot.com/sims/api_command.php";

// Your credentials - make sure these are set in your .env file
const TELLABOT_USERNAME = import.meta.env.VITE_TELL_A_BOT_USERNAME;
const TELLABOT_API_KEY = import.meta.env.VITE_TELL_A_BOT_API_KEY;

if (!TELLABOT_USERNAME || !TELLABOT_API_KEY) {
  console.error("Missing Tell A Bot credentials. Please set VITE_TELL_A_BOT_USERNAME and VITE_TELL_A_BOT_API_KEY in your .env file.");
  throw new Error("Tell A Bot credentials not configured");
}

interface ApiResponse {
  status: "ok" | "error";
  message?: any;
}

async function callTellabot<T>(cmd: string, params: Record<string, any> = {}): Promise<T> {
  const urlParams = new URLSearchParams({
    cmd,
    user: TELLABOT_USERNAME,
    api_key: TELLABOT_API_KEY,
    ...Object.fromEntries(
      Object.entries(params).map(([key, value]) => [key, String(value)])
    ),
  });

  const url = `${TELLABOT_BASE_URL}?${urlParams.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Accept": "application/json",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text || response.statusText}`);
  }

  const json: ApiResponse = await response.json();

  if (json.status === "error") {
    const msg = typeof json.message === "string" ? json.message : JSON.stringify(json.message);
    throw new Error(msg);
  }

  return json.message as T;
}

// ========================================
// PUBLIC INTERFACES (matching real API responses)
// ========================================

export interface TellabotService {
  name: string;
  price: number;                  // one-time base price in USD
  ltr_price: number;              // 30-day rental price
  ltr_short_price?: number;       // 3-day rental price (if available)
  available: number;              // one-time numbers currently in stock
  ltr_available: number;          // long-term numbers in stock
  recommended_markup?: number;    // suggested priority markup in cents
}

export interface OneTimeRequest {
  id: string;
  mdn: string | "";               // empty if still Awaiting MDN
  service: string;
  status: "Awaiting MDN" | "Reserved" | "Completed" | "Rejected" | "Timed Out";
  state?: string;                 // only for geo-targeted
  markup: number;
  price: number;
  carrier?: string;
  till_expiration: number;        // seconds left
}

export interface SMSMessage {
  timestamp: number;
  date_time: string;
  from: string;
  to: string;
  service: string;
  price: number;
  reply: string;
  pin?: string;
}

export interface LongTermRental {
  id: number;
  mdn: string;
  service: string;
  price: number;
  expires: string;                // human readable date
  carrier?: string;
}

export interface LTRStatus {
  ltr_status: "online" | "offline" | "awaiting mdn";
  mdn?: string;
  till_change: number;
  next_online: number;
  timestamp: number;
  date_time: string;
}

// ========================================
// TELLABOT API SERVICE (direct calls)
// ========================================

export const tellabotApi = {
  // === Balance ===
  async getBalance(): Promise<number> {
    const result = await callTellabot<string>("balance");
    return parseFloat(result);
  },

  // === Services ===
  async listServices(serviceName?: string): Promise<TellabotService[]> {
    const params = serviceName ? { service: serviceName } : {};
    return await callTellabot<TellabotService[]>("list_services", params);
  },

  // === One-time Numbers ===
  async requestNumber(
    service: string | string[],
    options?: {
      mdn?: string;
      areacode?: string;
      state?: string;
      markup?: number;
    }
  ): Promise<OneTimeRequest[]> {
    const params: any = {
      service: Array.isArray(service) ? service.join(",") : service,
      ...options,
    };

    const result = await callTellabot<any>("request", params);
    // API returns array even for single service
    return Array.isArray(result) ? result : [result];
  },

  async getRequestStatus(id: string): Promise<OneTimeRequest> {
    return await callTellabot<OneTimeRequest>("request_status", { id });
  },

  async rejectRequest(id: string): Promise<void> {
    await callTellabot("reject", { id });
  },

  async readSMS(options: {
    id?: string;          // one-time request ID
    ltr_id?: string;      // long-term rental ID
    mdn?: string;
    service?: string;
  }): Promise<SMSMessage[]> {
    return await callTellabot<SMSMessage[]>("read_sms", options);
  },

  async sendReply(mdn: string, to: string, text: string): Promise<void> {
    await callTellabot("send_sms", { mdn, to, sms: text });
  },

  // === Long-term Rentals ===
  async rentLongTerm(
    service: string,
    options?: {
      duration?: 3 | 30;
      mdn?: string;
      areacode?: string;
      state?: string;
      reserve?: boolean;
      autorenew?: boolean;
    }
  ): Promise<LongTermRental> {
    const params: any = {
      service,
      duration: options?.duration || 30,
      ...options,
    };
    if (options?.autorenew !== undefined) {
      params.autorenew = options.autorenew ? "true" : "false";
    }
    if (options?.reserve) {
      params.reserve = "true";
    }

    const result = await callTellabot<any>("ltr_rent", params);
    return {
      id: result.id,
      mdn: result.mdn,
      service: result.service,
      price: result.price,
      expires: result.expires,
      carrier: result.carrier,
    };
  },

  async toggleAutoRenew(
    identifiers: { ltr_id?: string; mdn?: string; service?: string },
    enable?: boolean
  ): Promise<boolean> {
    const params: any = { ...identifiers };
    if (enable !== undefined) {
      params.autorenew = enable ? "true" : "false";
    }

    const result = await callTellabot<any>("ltr_autorenew", params);
    // If no autorenew param, returns current boolean status
    return typeof result === "boolean" ? result : true;
  },

  async getLTRStatus(identifiers: { ltr_id?: string; mdn?: string }): Promise<LTRStatus> {
    return await callTellabot<LTRStatus>("ltr_status", identifiers);
  },

  async activateLTR(mdn: string): Promise<LTRStatus> {
    return await callTellabot<LTRStatus>("ltr_activate", { mdn });
  },

  async releaseLTR(identifiers: {
    ltr_id?: string;
    mdn?: string;
    service?: string;
  }): Promise<void> {
    await callTellabot("ltr_release", identifiers);
  },

  async reportBadNumber(mdn: string): Promise<void> {
    await callTellabot("ltr_report", { mdn });
  },

  async switchService(ltr_id: string | number, newService: string): Promise<void> {
    await callTellabot("ltr_switch_service", {
      ltr_id: ltr_id.toString(),
      service: newService,
    });
  },

  async setCallForwarding(
    ltr_id: string | number,
    destination: string // e.g. "15551234567"
  ): Promise<void> {
    await callTellabot("ltr_forward", {
      ltr_id: ltr_id.toString(),
      destination,
    });
  },
};