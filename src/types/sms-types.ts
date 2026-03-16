export interface Country {
  iso2: string;
  iso3: string;
  country: string;
  cities: string[];
}

export interface USState {
  code: string;
  name: string;
  areaCodes: string[];
}

export interface Service {
  name: string;
  price: string;
  ltr_price: string;
  ltr_short_price: string;
  available: string | number;
  ltr_available: string | number;
  icon?: string;
  countries?: Record<string, string>;
  recommended_markup?: string;
}

export interface ServicesResponse {
  status: string;
  message: Service[];
}

export interface SMSNumber {
  id: string;
  number: string;
  country: string;
  countryCode: string;
  service: string;
  price: number;
  status: 'active' | 'waiting' | 'completed' | 'cancelled';
  createdAt: Date;
  expiresAt: Date;
  messages: SMSMessage[];
  type: 'one-time' | 'rental';
  rentalDuration?: number; // in days for rental
  state?: string;
  areaCode?: string;
  markup?: number;
  carrier?: string;
  tillExpiration?: number;
}

export interface SMSMessage {
  id: string;
  from: string;
  text: string;
  receivedAt: Date;
  code?: string; // extracted verification code
}

export interface RentalPlan {
  duration: number; // days
  basePrice: number;
  finalPrice: number;
  description: string;
}

export interface PricingConfig {
  defaultMarkup: number;
  serviceMarkups: Record<string, number>;
  countryMarkups: Record<string, number>;
  blacklistedCountries: string[];
  blacklistedServices: string[];
  rentalMarkup: number;
}

export interface NumberRequest {
  service: string;
  country: string;
  type: 'one-time' | 'rental';
  rentalDuration?: number;
  state?: string;
  areaCode?: string;
  mdn?: string;
  markup?: number;
}

export interface TellABotResponse<T = any> {
  status: 'ok' | 'error';
  message: any;
  data?: T;
}

export interface NumberOrderResponse {
  number: string;
  id: string;
  country: string;
  service: string;
  price: number;
  expires_at: string;
}

export interface SMSCheckResponse {
  messages: Array<{
    from: string;
    text: string;
    received_at: string;
  }>;
}

export interface UserSession {
  activeNumbers: SMSNumber[];
  currentStep: 'service-selection' | 'country-selection' | 'number-type' | 'payment' | 'waiting' | 'completed';
  selectedService?: string;
  selectedCountry?: string;
  selectedType?: 'one-time' | 'rental';
  selectedRentalDuration?: number;
  lastActivity: Date;
}

// SMS Order types for Firestore
export type SMSOrderType = 'one-time' | 'long-term';
export type SMSOrderStatus = 'active' | 'completed' | 'cancelled' | 'expired';

export interface SMSOrder {
  id: string;
  userId: string;
  userEmail: string;
  username: string;
  orderType: SMSOrderType;
  service: string;
  mdn?: string; // Mobile Directory Number (phone number)
  externalId: string; // TellABot order ID
  status: SMSOrderStatus;
  price: number;
  basePrice: number;
  markup: number;
  expiresAt: Date;
  duration?: number; // rental duration in days
  smsMessages?: SMSMessageRecord[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface SMSMessageRecord {
  id: string;
  timestamp: number;
  dateTime: string;
  from: string;
  to: string;
  service: string;
  price: number;
  reply: string;
  pin?: string; // extracted verification code
}