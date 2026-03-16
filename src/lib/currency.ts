/* eslint-disable @typescript-eslint/no-explicit-any */
// Currency conversion utilities

// Default exchange rate (fallback if API fails)
const DEFAULT_USD_TO_NGN_RATE = 1550;

// Cache the rate for 10 minutes
let cachedRate: number | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export interface ExchangeRateResult {
  rate: number;
  source: 'api' | 'cache' | 'fallback';
}

/**
 * Fetches the current USD to NGN exchange rate
 * Uses multiple reliable APIs with fallbacks
 */
export async function getUsdToNgnRate(): Promise<ExchangeRateResult> {
  const now = Date.now();
  
  // Return cached rate if still valid
  if (cachedRate && (now - cacheTimestamp) < CACHE_DURATION) {
    return { rate: cachedRate, source: 'cache' };
  }
  
  // Try multiple APIs for better reliability
  const apis = [
    {
      url: 'https://api.exchangerate-api.com/v4/latest/USD',
      parser: (data: any) => data.rates?.NGN
    },
    {
      url: 'https://api.fxratesapi.com/latest?base=USD&symbols=NGN',
      parser: (data: any) => data.rates?.NGN
    },
    {
      url: 'https://open.er-api.com/v6/latest/USD',
      parser: (data: any) => data.rates?.NGN
    }
  ];
  
  for (const api of apis) {
    try {
      const response = await fetch(api.url);
      
      if (!response.ok) {
        continue; // Try next API
      }
      
      const data = await response.json();
      const rate = api.parser(data);
      
      if (rate && typeof rate === 'number' && rate > 0) {
        cachedRate = rate;
        cacheTimestamp = now;
        console.log(`💱 Exchange rate updated: 1 USD = ₦${rate.toFixed(2)} (${api.url})`);
        return { rate, source: 'api' };
      }
    } catch (error) {
      console.warn(`Failed to fetch from ${api.url}:`, error);
      continue; // Try next API
    }
  }
  
  // Return cached rate if available, even if expired
  if (cachedRate) {
    console.log(`💱 Using cached exchange rate: 1 USD = ₦${cachedRate.toFixed(2)}`);
    return { rate: cachedRate, source: 'cache' };
  }
  
  // Return default rate as last resort
  console.log(`💱 Using fallback exchange rate: 1 USD = ₦${DEFAULT_USD_TO_NGN_RATE}`);
  return { rate: DEFAULT_USD_TO_NGN_RATE, source: 'fallback' };
}

/**
 * Convert USD to NGN
 */
export function usdToNgn(usdAmount: number, rate: number): number {
  return Math.round(usdAmount * rate * 100) / 100;
}

/**
 * Convert NGN to USD
 */
export function ngnToUsd(ngnAmount: number, rate: number): number {
  return Math.round((ngnAmount / rate) * 100) / 100;
}

/**
 * Format currency with proper symbols and formatting
 */
export function formatCurrency(amount: number, currency: 'USD' | 'NGN'): string {
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  } else {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }
}