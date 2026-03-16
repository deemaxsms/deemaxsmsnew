// Transaction validation utilities
// This module provides validation functions to ensure data integrity

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate purchase request data before processing
 */
export function validatePurchaseRequest(
  userId: string,
  productId: string,
  userBalance: number,
  productPrice: number,
  requestDetails?: any
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required field validation
  if (!userId || typeof userId !== 'string') {
    errors.push('Invalid user ID');
  }

  if (!productId || typeof productId !== 'string') {
    errors.push('Invalid product ID');
  }

  if (typeof userBalance !== 'number' || userBalance < 0) {
    errors.push('Invalid user balance');
  }

  if (typeof productPrice !== 'number' || productPrice <= 0) {
    errors.push('Invalid product price');
  }

  // Balance validation
  if (userBalance < productPrice) {
    errors.push(`Insufficient balance: $${userBalance.toFixed(2)} < $${productPrice.toFixed(2)}`);
  }

  // Request details validation (if provided)
  if (requestDetails) {
    if (typeof requestDetails !== 'object') {
      errors.push('Invalid request details format');
    } else {
      // Check for undefined values that would cause Firestore errors
      const checkForUndefined = (obj: any, path: string = '') => {
        for (const [key, value] of Object.entries(obj)) {
          const currentPath = path ? `${path}.${key}` : key;
          if (value === undefined) {
            errors.push(`Undefined value found at ${currentPath}`);
          } else if (value && typeof value === 'object') {
            checkForUndefined(value, currentPath);
          }
        }
      };
      checkForUndefined(requestDetails);

      // Validate specific fields
      if (requestDetails.location && typeof requestDetails.location !== 'string') {
        errors.push('Location must be a string');
      }
      if (requestDetails.duration && typeof requestDetails.duration !== 'string') {
        errors.push('Duration must be a string');
      }
      if (requestDetails.specifications && typeof requestDetails.specifications !== 'string') {
        errors.push('Specifications must be a string');
      }
      if (requestDetails.additionalNotes && typeof requestDetails.additionalNotes !== 'string') {
        errors.push('Additional notes must be a string');
      }
    }
  }

  // Warnings for edge cases
  if (userBalance - productPrice < 1) {
    warnings.push('Balance will be very low after purchase');
  }

  if (productPrice > 100) {
    warnings.push('High-value purchase detected');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate transaction data before recording
 */
export function validateTransaction(
  userId: string,
  type: string,
  amount: number,
  description: string,
  balanceAfter: number
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required field validation
  if (!userId || typeof userId !== 'string') {
    errors.push('Invalid user ID');
  }

  if (!type || typeof type !== 'string') {
    errors.push('Invalid transaction type');
  }

  if (typeof amount !== 'number') {
    errors.push('Invalid amount');
  }

  if (!description || typeof description !== 'string') {
    errors.push('Invalid description');
  }

  if (typeof balanceAfter !== 'number' || balanceAfter < 0) {
    errors.push('Invalid balance after transaction');
  }

  // Type-specific validation
  const validTypes = ['deposit', 'withdrawal', 'purchase', 'refund', 'referral_bonus'];
  if (!validTypes.includes(type)) {
    errors.push(`Invalid transaction type: ${type}`);
  }

  // Amount validation based on type
  if (type === 'purchase' || type === 'withdrawal') {
    if (amount >= 0) {
      errors.push(`${type} amount should be negative`);
    }
  } else if (type === 'deposit' || type === 'refund' || type === 'referral_bonus') {
    if (amount <= 0) {
      errors.push(`${type} amount should be positive`);
    }
  }

  // Warnings
  if (Math.abs(amount) > 1000) {
    warnings.push('Large transaction amount detected');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate product order data
 */
export function validateProductOrder(orderData: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  const requiredFields = ['userId', 'productId', 'productName', 'category', 'price', 'status'];
  for (const field of requiredFields) {
    if (!orderData[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Type validation
  if (orderData.price && (typeof orderData.price !== 'number' || orderData.price <= 0)) {
    errors.push('Invalid price');
  }

  if (orderData.status && !['pending', 'processing', 'completed', 'cancelled', 'refunded'].includes(orderData.status)) {
    errors.push(`Invalid status: ${orderData.status}`);
  }

  if (orderData.category && !['esim', 'proxy', 'vpn', 'rdp', 'gift'].includes(orderData.category)) {
    warnings.push(`Unusual category: ${orderData.category}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Clean object to remove undefined values (Firestore safe)
 */
export function cleanFirestoreData(obj: any): any {
  if (obj === null || obj === undefined) {
    return null;
  }

  if (Array.isArray(obj)) {
    return obj.map(cleanFirestoreData).filter(item => item !== undefined);
  }

  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        const cleanedValue = cleanFirestoreData(value);
        if (cleanedValue !== undefined) {
          cleaned[key] = cleanedValue;
        }
      }
    }
    return cleaned;
  }

  return obj;
}

/**
 * Validate user balance consistency
 */
export function validateBalanceConsistency(
  profileBalance: number,
  calculatedBalance: number,
  tolerance: number = 0.01
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const discrepancy = Math.abs(profileBalance - calculatedBalance);

  if (discrepancy > tolerance) {
    errors.push(`Balance discrepancy: Profile shows $${profileBalance.toFixed(2)}, calculated $${calculatedBalance.toFixed(2)}`);
  }

  if (profileBalance < 0) {
    errors.push('Negative balance detected');
  }

  if (calculatedBalance < 0) {
    warnings.push('Calculated balance is negative - possible transaction history issue');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}