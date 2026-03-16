export interface ESimOrder {
  id: string;
  userId: string;
  userEmail: string;
  username: string;
  iccid: string; // SIM card identifier
  phoneNumber?: string;
  provider: string;
  region: string;
  dataAllowance: string; // e.g., "5GB", "10GB"
  validityPeriod: string; // e.g., "30 days", "7 days"
  price: number;
  status: 'active' | 'expired' | 'suspended' | 'cancelled';
  activatedAt?: Date;
  expiresAt: Date;
  dataUsed: number; // in MB
  dataRemaining: number; // in MB
  totalDataMB: number; // total data in MB
  qrCode?: string;
  activationCode?: string;
  refillHistory: ESimRefill[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ESimRefill {
  id: string;
  esimOrderId: string;
  userId: string;
  refillType: 'data' | 'validity' | 'both';
  dataAmount?: number; // in MB
  validityExtension?: number; // in days
  price: number;
  status: 'pending' | 'completed' | 'failed';
  processedAt?: Date;
  createdAt: Date;
}

export interface ESimRefillRequest {
  id: string;
  esimOrderId: string;
  userId: string;
  userEmail: string;
  username: string;
  esimDetails: {
    iccid: string;
    provider: string;
    region: string;
    currentDataRemaining: number;
    currentExpiresAt: Date;
  };
  refillPlan: {
    id: string;
    name: string;
    dataAmount?: number;
    validityDays?: number;
    price: number;
  };
  refillType: 'data' | 'validity' | 'both';
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'failed';
  adminNotes?: string;
  processedBy?: string; // Admin ID
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface RefillPlan {
  id: string;
  name: string;
  description: string;
  dataAmount?: number; // in MB
  validityDays?: number;
  price: number;
  region: string;
  provider: string;
  type: 'data-only' | 'validity-only' | 'data-and-validity';
  isPopular?: boolean;
}

export interface ESimRefillSubmission {
  esimOrderId: string;
  refillPlanId: string;
  refillType: 'data' | 'validity' | 'both';
  dataAmount?: number;
  validityExtension?: number;
}

export interface ESimUsageStats {
  totalData: number;
  usedData: number;
  remainingData: number;
  dataUsagePercentage: number;
  daysRemaining: number;
  isExpiringSoon: boolean; // within 3 days
  isLowData: boolean; // less than 10% remaining
}