/* eslint-disable @typescript-eslint/no-explicit-any */
import { firestoreService, BalanceTransaction } from './firestore-service';

/**
 * Centralized Balance Management Service
 * Ensures consistent balance tracking across the application
 */
class BalanceManager {
  private static instance: BalanceManager;
  private balanceCache = new Map<string, number>();
  private transactionQueue = new Map<string, BalanceTransaction[]>();

  static getInstance(): BalanceManager {
    if (!BalanceManager.instance) {
      BalanceManager.instance = new BalanceManager();
    }
    return BalanceManager.instance;
  }

  /**
   * Get user's current balance with caching
   */
  async getCurrentBalance(userId: string): Promise<number> {
    try {
      // Check cache first
      if (this.balanceCache.has(userId)) {
        return this.balanceCache.get(userId)!;
      }

      // Fetch from Firestore
      const profile = await firestoreService.getUserProfile(userId);
      const balance = profile?.balance || 0;
      
      // Cache the result
      this.balanceCache.set(userId, balance);
      return balance;
    } catch (error) {
      console.error('Error getting current balance:', error);
      return 0;
    }
  }

  /**
   * Update balance with transaction recording - SECURE VERSION
   */
  async updateBalance(
    userId: string, 
    amount: number, 
    type: 'deposit' | 'purchase' | 'refund' | 'withdrawal' | 'referral_bonus',
    description: string,
    metadata?: { txRef?: string; transactionId?: string; orderId?: string }
  ): Promise<{ success: boolean; newBalance: number; error?: string }> {
    try {
      // SECURITY: Validate inputs
      if (!userId || typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
        return {
          success: false,
          newBalance: 0,
          error: 'Invalid input parameters'
        };
      }

      // SECURITY: Validate transaction type
      const validTypes = ['deposit', 'purchase', 'refund', 'withdrawal', 'referral_bonus'];
      if (!validTypes.includes(type)) {
        return {
          success: false,
          newBalance: 0,
          error: `Invalid transaction type: ${type}`
        };
      }

      // Get current balance
      const currentBalance = await this.getCurrentBalance(userId);
      
      // Calculate new balance with proper validation
      let newBalance: number;
      let transactionAmount: number;

      if (type === 'deposit' || type === 'refund' || type === 'referral_bonus') {
        // Credits: Always positive
        newBalance = currentBalance + Math.abs(amount);
        transactionAmount = Math.abs(amount); // Store as positive
      } else if (type === 'purchase' || type === 'withdrawal') {
        // Debits: Check sufficient balance first
        const debitAmount = Math.abs(amount);
        
        if (currentBalance < debitAmount) {
          return {
            success: false,
            newBalance: currentBalance,
            error: `Insufficient balance. Required: ${debitAmount.toFixed(2)}, Available: ${currentBalance.toFixed(2)}`
          };
        }
        
        newBalance = currentBalance - debitAmount;
        transactionAmount = -debitAmount; // Store as negative
      } else {
        throw new Error(`Invalid transaction type: ${type}`);
      }

      // SECURITY: Ensure balance never goes negative
      newBalance = Math.max(0, newBalance);

      // SECURITY: Use atomic operation (simulate with try-catch)
      try {
        // Update balance in Firestore
        await firestoreService.updateUserBalance(userId, newBalance);

        // Record transaction with validated amount
        await firestoreService.addBalanceTransaction({
          userId,
          type,
          amount: transactionAmount,
          description: `${description} (Validated)`,
          balanceAfter: newBalance,
          txRef: metadata?.txRef,
          transactionId: metadata?.transactionId || metadata?.orderId
        });

        // Update cache only after successful database operations
        this.balanceCache.set(userId, newBalance);

        // SECURITY: Log transaction for audit
        console.log(`Balance updated for ${userId}:`, {
          type,
          amount: transactionAmount,
          oldBalance: currentBalance,
          newBalance,
          description
        });

        return { success: true, newBalance };
      } catch (dbError) {
        // Rollback cache if database operations failed
        this.balanceCache.delete(userId);
        throw dbError;
      }
    } catch (error) {
      console.error('Error updating balance:', error);
      return {
        success: false,
        newBalance: await this.getCurrentBalance(userId),
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Process a purchase with balance deduction
   */
  async processPurchase(
    userId: string,
    amount: number,
    description: string,
    orderId?: string
  ): Promise<{ success: boolean; newBalance: number; error?: string }> {
    return this.updateBalance(userId, amount, 'purchase', description, { orderId });
  }

  /**
   * Process a deposit/top-up
   */
  async processDeposit(
    userId: string,
    amount: number,
    description: string,
    txRef?: string,
    transactionId?: string
  ): Promise<{ success: boolean; newBalance: number; error?: string }> {
    return this.updateBalance(userId, amount, 'deposit', description, { txRef, transactionId });
  }

  /**
   * Process a refund
   */
  async processRefund(
    userId: string,
    amount: number,
    description: string,
    orderId?: string
  ): Promise<{ success: boolean; newBalance: number; error?: string }> {
    return this.updateBalance(userId, amount, 'refund', description, { orderId });
  }

  /**
   * Verify balance integrity by comparing with transaction history - SECURE VERSION
   */
  async verifyBalanceIntegrity(userId: string): Promise<{
    isValid: boolean;
    currentBalance: number;
    calculatedBalance: number;
    discrepancy: number;
    transactions: BalanceTransaction[];
    transactionCount: number;
    lastTransactionDate?: Date;
  }> {
    try {
      // Get current balance from profile
      const profile = await firestoreService.getUserProfile(userId);
      const currentBalance = profile?.balance || 0;

      // Get all transactions
      const transactions = await firestoreService.getUserTransactions(userId);

      // Calculate balance from transactions - SECURE METHOD
      let calculatedBalance = 0;
      const sortedTransactions = transactions.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(0);
        const bTime = b.createdAt?.toDate?.() || new Date(0);
        return aTime.getTime() - bTime.getTime();
      });

      // SECURITY FIX: Proper transaction amount handling by type
      for (const transaction of sortedTransactions) {
        if (transaction.type === 'deposit' || transaction.type === 'refund' || transaction.type === 'referral_bonus') {
          // Credits: Add absolute value to ensure positive
          calculatedBalance += Math.abs(transaction.amount);
        } else if (transaction.type === 'purchase' || transaction.type === 'withdrawal') {
          // Debits: Subtract absolute value to ensure negative impact
          calculatedBalance -= Math.abs(transaction.amount);
        } else {
          console.warn(`Unknown transaction type: ${transaction.type} for transaction ${transaction.id}`);
        }
      }

      // Ensure balance never goes negative
      calculatedBalance = Math.max(0, calculatedBalance);

      const discrepancy = currentBalance - calculatedBalance;
      const isValid = Math.abs(discrepancy) < 0.01; // Allow for small floating point differences

      // Get last transaction date
      const lastTransactionDate = sortedTransactions.length > 0 
        ? sortedTransactions[sortedTransactions.length - 1].createdAt?.toDate?.()
        : undefined;

      // SECURITY: Log verification for audit trail
      console.log(`Balance verification for ${userId}:`, {
        currentBalance,
        calculatedBalance,
        discrepancy,
        transactionCount: transactions.length,
        isValid
      });

      return {
        isValid,
        currentBalance,
        calculatedBalance,
        discrepancy,
        transactions: sortedTransactions,
        transactionCount: transactions.length,
        lastTransactionDate
      };
    } catch (error) {
      console.error('Error verifying balance integrity:', error);
      throw error;
    }
  }

  /**
   * Fix balance discrepancies - DISABLED FOR SECURITY
   * DO NOT USE - Contains critical bug that inflates balances
   */
  async fixBalanceDiscrepancy(userId: string): Promise<{ 
    success: boolean; 
    newBalance: number; 
    error?: string;
    correctionAmount?: number;
    transactionId?: string;
  }> {
    // SECURITY: Auto-fix disabled due to critical balance inflation bug
    console.error('🚨 SECURITY: Balance auto-fix disabled due to critical bug');
    return {
      success: false,
      newBalance: 0,
      error: 'Auto-fix disabled for security reasons. Contact administrator.'
    };
  }

  /**
   * Clear cache for a user (useful after external balance changes)
   */
  clearUserCache(userId: string): void {
    this.balanceCache.delete(userId);
  }

  /**
   * Clear all cache
   */
  clearAllCache(): void {
    this.balanceCache.clear();
  }

  /**
   * Get cached balance (returns null if not cached)
   */
  getCachedBalance(userId: string): number | null {
    return this.balanceCache.get(userId) || null;
  }
}

export const balanceManager = BalanceManager.getInstance();