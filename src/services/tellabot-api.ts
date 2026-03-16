/* eslint-disable @typescript-eslint/no-explicit-any */

// Environment-based API URL configuration
const getApiBaseUrl = () => {
  // Check if we're in development with proxy available
  if (import.meta.env.DEV) {
    return "/api/tellabot"; // Use Vite proxy in development
  }
  
  // In production, use Vercel serverless function
  return "/api/tellabot"; // This will hit our Vercel API route
};

const TELLABOT_BASE_URL = getApiBaseUrl();

// In production, use env variables. Hardcoded for testing only.
const TELLABOT_USERNAME = import.meta.env.VITE_TELL_A_BOT_USERNAME;
const TELLABOT_API_KEY = import.meta.env.VITE_TELL_A_BOT_API_KEY;

if (!TELLABOT_USERNAME || !TELLABOT_API_KEY) {
  console.error(
    "Missing Tell A Bot credentials. Please set VITE_TELL_A_BOT_USERNAME and VITE_TELL_A_BOT_API_KEY in your .env file."
  );
  throw new Error("Tell A Bot credentials not configured");
}

interface ApiResponse {
  status: "ok" | "error";
  message?: any;
}

async function callTellabot<T>(cmd: string, params: Record<string, any> = {}): Promise<T> {
  const filteredParams = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== "")
  );

  const urlParams = new URLSearchParams({
    cmd,
    user: TELLABOT_USERNAME,
    api_key: TELLABOT_API_KEY,
    ...Object.fromEntries(Object.entries(filteredParams).map(([k, v]) => [k, String(v)])),
  });

  const url = `${TELLABOT_BASE_URL}?${urlParams.toString()}`;

  // Debug logging (remove in production)
  console.log(`🔄 Tellabot API Call: ${cmd}`, {
    baseUrl: TELLABOT_BASE_URL,
    isDev: import.meta.env.DEV,
    isProd: import.meta.env.PROD
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const text = await response.text();
      console.error(`API Error - Status: ${response.status}, URL: ${url}, Response: ${text}`);
      
      // Check if we got HTML instead of JSON (common in production errors)
      if (text.includes('<!DOCTYPE') || text.includes('<html')) {
        throw new Error(`Server returned HTML instead of JSON. This usually means the API endpoint is not available. Status: ${response.status}`);
      }
      
      throw new Error(`HTTP ${response.status}: ${text || response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error(`Non-JSON response - Content-Type: ${contentType}, Response: ${text}`);
      throw new Error(`Expected JSON response but got ${contentType || 'unknown content type'}`);
    }

    const json: ApiResponse = await response.json();

    if (json.status === "error") {
      const msg = typeof json.message === "string" ? json.message : JSON.stringify(json.message);
      throw new Error(msg);
    }

    console.log(`✅ Tellabot API Success: ${cmd}`);
    return json.message as T;
  } catch (err: any) {
    clearTimeout(timeoutId);

    if (err.name === "AbortError") {
      throw new Error("Request timed out. Please check your connection and try again.");
    }

    // Log the full error for debugging
    console.error(`❌ Tellabot API Error:`, {
      cmd,
      url: url.replace(/api_key=[^&]+/, 'api_key=***'), // Hide API key in logs
      error: err.message,
      stack: err.stack
    });

    throw err;
  }
}

// ========================================
// PUBLIC INTERFACES (exact match to API)
// ========================================

export interface TellabotService {
  name: string;
  price: number;
  ltr_price: number;
  ltr_short_price?: number;
  available: number;
  ltr_available: number;
  recommended_markup?: number;
}

export interface OneTimeRequest {
  id: string;
  mdn: string | "";
  service: string;
  status: "Awaiting MDN" | "Reserved" | "Completed" | "Rejected" | "Timed Out";
  state?: string;
  markup: number;
  price: number;
  carrier?: string;
  till_expiration: number;
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
  expires: string;
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
// PRODUCTION-READY API OBJECT
// ========================================

export const tellabotApi = {
  async getBalance(): Promise<number> {
    const result = await callTellabot<string>("balance");
    return parseFloat(result);
  },

  async listServices(serviceName?: string): Promise<TellabotService[]> {
    const params = serviceName ? { service: serviceName } : {};
    const data = await callTellabot<any[]>("list_services", params);

    return data.map((s: any) => ({
      name: s.name,
      price: parseFloat(s.price || "0"),
      ltr_price: parseFloat(s.ltr_price || "0"),
      ltr_short_price: s.ltr_short_price ? parseFloat(s.ltr_short_price) : undefined,
      available: parseInt(s.available || "0", 10),
      ltr_available: parseInt(s.ltr_available || "0", 10),
      recommended_markup: s.recommended_markup ? parseInt(s.recommended_markup, 10) : undefined,
    }));
  },

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
    const array = Array.isArray(result) ? result : [result];

    return array.map((r: any) => ({
      id: r.id,
      mdn: r.mdn || "",
      service: r.service,
      status: r.status as OneTimeRequest["status"],
      state: r.state,
      markup: parseInt(r.markup || "0", 10),
      price: parseFloat(r.price || "0"),
      carrier: r.carrier,
      till_expiration: parseInt(r.till_expiration || "900", 10),
    }));
  },

  async getRequestStatus(id: string): Promise<OneTimeRequest> {
    const r = await callTellabot<any>("request_status", { id });
    return {
      id: r.id,
      mdn: r.mdn || "",
      service: r.service,
      status: r.status,
      state: r.state,
      markup: parseInt(r.markup || "0", 10),
      price: parseFloat(r.price || "0"),
      carrier: r.carrier,
      till_expiration: parseInt(r.till_expiration || "0", 10),
    };
  },

  async rejectRequest(id: string): Promise<void> {
    await callTellabot("reject", { id });
  },

  async readSMS(options: {
    id?: string;
    ltr_id?: string;
    mdn?: string;
    service?: string;
  }): Promise<SMSMessage[]> {
    const result = await callTellabot<any>("read_sms", options);
    const array = Array.isArray(result) ? result : [];

    return array.map((m: any) => ({
      timestamp: parseInt(m.timestamp || "0", 10),
      date_time: m.date_time || "",
      from: m.from || "",
      to: m.to || "",
      service: m.service || "",
      price: parseFloat(m.price || "0"),
      reply: m.reply || "",
      pin: m.pin,
    }));
  },

  async sendReply(mdn: string, to: string, text: string): Promise<void> {
    await callTellabot("send_sms", { mdn, to, sms: text });
  },

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
    if (options?.autorenew !== undefined) params.autorenew = options.autorenew ? "true" : "false";
    if (options?.reserve) params.reserve = "true";

    const r = await callTellabot<any>("ltr_rent", params);
    return {
      id: r.id,
      mdn: r.mdn || "",
      service: r.service,
      price: parseFloat(r.price || "0"),
      expires: r.expires || "",
      carrier: r.carrier,
    };
  },

  async toggleAutoRenew(
    identifiers: { ltr_id?: string; mdn?: string; service?: string },
    enable?: boolean
  ): Promise<boolean> {
    const params: any = { ...identifiers };
    if (enable !== undefined) params.autorenew = enable ? "true" : "false";

    const result = await callTellabot<any>("ltr_autorenew", params);
    return typeof result === "boolean" ? result : true;
  },

  async getLTRStatus(identifiers: { ltr_id?: string; mdn?: string }): Promise<LTRStatus> {
    return await callTellabot<LTRStatus>("ltr_status", identifiers);
  },

  async activateLTR(mdn: string): Promise<LTRStatus> {
    return await callTellabot<LTRStatus>("ltr_activate", { mdn });
  },

  async releaseLTR(identifiers: { ltr_id?: string; mdn?: string; service?: string }): Promise<void> {
    await callTellabot("ltr_release", identifiers);
  },

  async reportBadNumber(mdn: string): Promise<void> {
    await callTellabot("ltr_report", { mdn });
  },

  async switchService(ltr_id: string | number, newService: string): Promise<void> {
    await callTellabot("ltr_switch_service", { ltr_id: String(ltr_id), service: newService });
  },

  async setCallForwarding(ltr_id: string | number, destination: string): Promise<void> {
    await callTellabot("ltr_forward", { ltr_id: String(ltr_id), destination });
  },
};