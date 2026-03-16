/* eslint-disable @typescript-eslint/no-explicit-any */
import { firestoreService } from "@/lib/firestore-service";

// Tellabot API Configuration
const TELLABOT_API_URL = "https://www.tellabot.com/sims/api_command.php";

// Environment variables with fallbacks and validation
const TELL_A_BOT_API_KEY = import.meta.env.VITE_TELL_A_BOT_API_KEY;
const TELL_A_BOT_USERNAME = import.meta.env.VITE_TELL_A_BOT_USERNAME;
const MARKUP_PERCENTAGE = 0.5; // 50% markup

// Validate required environment variables
if (!TELL_A_BOT_API_KEY) {
  throw new Error('Missing required environment variable: VITE_TELL_A_BOT_API_KEY');
}

if (!TELL_A_BOT_USERNAME) {
  throw new Error('Missing required environment variable: VITE_TELL_A_BOT_USERNAME');
}

// Common API response interface
export interface TellabotResponse {
  status: 'ok' | 'error';
  message: any;
}

// Service interfaces
export interface SMSService {
  name: string;
  displayName: string;
  icon?: string;
  basePrice: number;
  markupPrice: number;
  ltrPrice?: number;
  ltrMarkupPrice?: number;
  ltrShortPrice?: number;
  ltrShortMarkupPrice?: number;
  available: number;
  ltrAvailable?: number;
  recommendedMarkup: number;
}

export interface SMSRequestResult {
  id: string;
  mdn?: string;
  service: string;
  status: 'pending' | 'awaiting_mdn' | 'reserved' | 'active' | 'completed' | 'rejected' | 'timed_out' | 'cancelled' | 'expired';
  state?: string;
  markup: number;
  basePrice: number;
  markupPrice: number;
  carrier?: string;
  tillExpiration: number;
  externalId: string;
}

export interface SMSStatusResult {
  id: string;
  mdn?: string;
  service: string;
  status: 'pending' | 'awaiting_mdn' | 'reserved' | 'active' | 'completed' | 'rejected' | 'timed_out' | 'cancelled' | 'expired';
  state?: string;
  markup: number;
  carrier?: string;
  tillExpiration: number;
}

export interface SMSMessageResult {
  timestamp: number;
  dateTime: string;
  from: string;
  to: string;
  service: string;
  price: number;
  reply: string;
  pin?: string;
}

export interface LTRRentResult {
  id: string;
  mdn: string;
  service: string;
  basePrice: number;
  markupPrice: number;
  expires: string;
  carrier: string;
  externalId: string;
}

export interface LTRStatusResult {
  ltrStatus: 'online' | 'offline' | 'awaiting mdn';
  mdn?: string;
  tillChange: number;
  nextOnline: number;
  timestamp: number;
  dateTime: string;
}

// Utility functions
export function calculateMarkupPrice(basePrice: number): number {
  return Math.round((basePrice * (1 + MARKUP_PERCENTAGE)) * 100) / 100;
}

export function buildApiParams(params: Record<string, any>): URLSearchParams {
  const searchParams = new URLSearchParams();
  searchParams.append('user', TELL_A_BOT_USERNAME);
  searchParams.append('TELL_A_BOT_API_KEY', TELL_A_BOT_API_KEY);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, value.toString());
    }
  });
  return searchParams;
}

export async function callTellabotAPI(params: Record<string, any>): Promise<TellabotResponse> {
  try {
    const searchParams = buildApiParams(params);
    const response = await fetch(`${TELLABOT_API_URL}?${searchParams.toString()}`);

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data: TellabotResponse = await response.json();

    // Handle specific API errors gracefully
    if (data.status === 'error') {
      const errorMessage = data.message;

      // Check for account activation required
      if (typeof errorMessage === 'string' &&
          errorMessage.toLowerCase().includes('account is under review') &&
          errorMessage.toLowerCase().includes('minimum deposit')) {
        console.warn('SMS API Account Status:', errorMessage);
        throw new Error('Your SMS service account requires activation. Please make a minimum deposit to activate your account.');
      }

      // Check for balance-related errors
      if (typeof errorMessage === 'string' &&
          (errorMessage.toLowerCase().includes('insufficient funds') ||
           errorMessage.toLowerCase().includes('balance') ||
           errorMessage.toLowerCase().includes('funds'))) {
        console.warn('SMS API Balance Error:', errorMessage);
        throw new Error('Insufficient account balance. Please top up your account to continue using SMS services.');
      }

      // Check for service availability errors
      if (typeof errorMessage === 'string' &&
          (errorMessage.toLowerCase().includes('no numbers available') ||
           errorMessage.toLowerCase().includes('retry later'))) {
        console.warn('SMS API Availability Error:', errorMessage);
        throw new Error('SMS numbers are currently unavailable. Please try again in a few minutes.');
      }

      // Log other API errors for debugging but show user-friendly message
      console.error('Tellabot API Error:', errorMessage);
      throw new Error('Service temporarily unavailable. Please try again later.');
    }

    return data;
  } catch (error) {
    console.error('Tellabot API call failed:', error);

    // If it's already a user-friendly error, re-throw it
    if (error instanceof Error &&
        (error.message.includes('Insufficient account balance') ||
         error.message.includes('SMS numbers are currently unavailable') ||
         error.message.includes('Service temporarily unavailable'))) {
      throw error;
    }

    throw new Error('Failed to communicate with SMS service provider');
  }
}

export async function checkUserBalance(userId: string, requiredAmount: number): Promise<{ hasBalance: boolean; currentBalance: number }> {
  const profile = await firestoreService.getUserProfile(userId);
  if (!profile) {
    throw new Error('User profile not found');
  }
  
  return {
    hasBalance: profile.balance >= requiredAmount,
    currentBalance: profile.balance
  };
}

export async function deductFromBalance(userId: string, amount: number, description: string): Promise<void> {
  const profile = await firestoreService.getUserProfile(userId);
  if (!profile) {
    throw new Error('User profile not found');
  }
  
  if (profile.balance < amount) {
    throw new Error('Insufficient balance. Please top up your account.');
  }
  
  const newBalance = profile.balance - amount;
  
  await firestoreService.updateUserBalance(userId, newBalance);
  await firestoreService.addBalanceTransaction({
    userId,
    type: 'purchase',
    amount: -amount,
    description,
    balanceAfter: newBalance
  });
}
