// Transaction monitoring and health check utilities
// This module provides functions to monitor transaction integrity

import { firestoreService, BalanceTransaction } from './firestore-service';

export interface TransactionHealthReport {
  userId: string;
  userEmail: string;
  currentBalance: number;
  calculatedBalance: number;
  discrepancy: number;
  isHealthy: boolean;
  transactionCount: number;
  lastTransactionDate?: Date;
  issues: string[];
}

export interface SystemHealthReport {
  totalUsers: number;
  healthyUsers: number;
  usersWithIssues: number;
  totalDiscrepancy: number;
  criticalIssues: TransactionHealthReport[];
  summary: {
    avgBalance: number;
    totalBalance: number;
    totalTransactions: number;
  };
}

/**
 * Check transaction health for a specific user
 */
export async function checkUserTransactionHealth(userId: string): Promise<TransactionHealthReport> {
  try {
    // Get user profile
    const profile = await firestoreService.getUserProfile(userId);
    if (!profile) {
      return {
        userId,
        userEmail: 'unknown',
        currentBalance: 0,
        calculatedBalance: 0,
        discrepancy: 0,
        isHealthy: false,
        transactionCount: 0,
        issues: ['User profile not found']
      };
    }

    // Get all transactions
    const transactions = await firestoreService.getUserTransactions(userId);
    
    // Calculate balance from transactions
    let calculatedBalance = 0;
    let lastTransactionDate: Date | undefined;

    for (const tx of transactions) {
      if (tx.type === 'deposit' || tx.type === 'referral_bonus' || tx.type === 'refund') {
        calculatedBalance += Math.abs(tx.amount);
      } else if (tx.type === 'purchase' || tx.type === 'withdrawal') {
        calculatedBalance -= Math.abs(tx.amount);
      }

      // Track last transaction date
      if (tx.createdAt?.toDate) {
        const txDate = tx.createdAt.toDate();
        if (!lastTransactionDate || txDate > lastTransactionDate) {
          lastTransactionDate = txDate;
        }
      }
    }

    calculatedBalance = Math.max(0, calculatedBalance);
    const discrepancy = Math.abs(profile.balance - calculatedBalance);
    const issues: string[] = [];

    // Check for issues
    if (discrepancy > 0.01) {
      issues.push(`Balance mismatch: Profile shows $${profile.balance.toFixed(2)}, transactions show $${calculatedBalance.toFixed(2)}`);
    }

    if (profile.balance < 0) {
      issues.push('Negative balance detected');
    }

    // Check for suspicious transaction patterns
    const recentTransactions = transactions.filter(tx => {
      if (!tx.createdAt?.toDate) return false;
      const txDate = tx.createdAt.toDate();
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return txDate > oneDayAgo;
    });

    const failedPurchases = recentTransactions.filter(tx => 
      tx.type === 'purchase' && tx.description.includes('failed')
    );

    if (failedPurchases.length > 0) {
      issues.push(`${failedPurchases.length} failed purchase(s) in last 24 hours`);
    }

    return {
      userId,
      userEmail: profile.email,
      currentBalance: profile.balance,
      calculatedBalance,
      discrepancy,
      isHealthy: issues.length === 0,
      transactionCount: transactions.length,
      lastTransactionDate,
      issues
    };

  } catch (error) {
    console.error(`Error checking transaction health for user ${userId}:`, error);
    return {
      userId,
      userEmail: 'unknown',
      currentBalance: 0,
      calculatedBalance: 0,
      discrepancy: 0,
      isHealthy: false,
      transactionCount: 0,
      issues: [`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
    };
  }
}

/**
 * Monitor transaction in real-time (call after each purchase)
 */
export async function monitorTransaction(
  userId: string, 
  transactionType: 'purchase' | 'deposit' | 'refund',
  amount: number,
  description: string
): Promise<{ success: boolean; warnings: string[] }> {
  const warnings: string[] = [];

  try {
    // Get current health before transaction
    const healthBefore = await checkUserTransactionHealth(userId);
    
    // Wait a moment for transaction to be recorded
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check health after transaction
    const healthAfter = await checkUserTransactionHealth(userId);
    
    // Verify the transaction was recorded correctly
    const expectedBalanceChange = transactionType === 'purchase' ? -amount : amount;
    const actualBalanceChange = healthAfter.currentBalance - healthBefore.currentBalance;
    
    if (Math.abs(actualBalanceChange - expectedBalanceChange) > 0.01) {
      warnings.push(`Balance change mismatch: Expected ${expectedBalanceChange.toFixed(2)}, got ${actualBalanceChange.toFixed(2)}`);
    }

    // Check if transaction count increased
    if (healthAfter.transactionCount <= healthBefore.transactionCount) {
      warnings.push('Transaction may not have been recorded in history');
    }

    // Check for new issues
    const newIssues = healthAfter.issues.filter(issue => !healthBefore.issues.includes(issue));
    warnings.push(...newIssues);

    console.log(`📊 Transaction Monitor: ${transactionType} of $${amount} for user ${userId}`);
    console.log(`   Balance: $${healthBefore.currentBalance.toFixed(2)} → $${healthAfter.currentBalance.toFixed(2)}`);
    console.log(`   Transactions: ${healthBefore.transactionCount} → ${healthAfter.transactionCount}`);
    
    if (warnings.length > 0) {
      console.warn(`⚠️  Transaction warnings:`, warnings);
    } else {
      console.log(`✅ Transaction monitoring: All checks passed`);
    }

    return { success: warnings.length === 0, warnings };

  } catch (error) {
    console.error('Transaction monitoring failed:', error);
    return { 
      success: false, 
      warnings: [`Monitoring failed: ${error instanceof Error ? error.message : 'Unknown error'}`] 
    };
  }
}

/**
 * Auto-fix user balance if discrepancy is detected
 */
export async function autoFixUserBalance(userId: string): Promise<{ fixed: boolean; oldBalance: number; newBalance: number; error?: string }> {
  try {
    const health = await checkUserTransactionHealth(userId);
    
    if (health.discrepancy > 0.01) {
      console.log(`🔧 Auto-fixing balance for user ${health.userEmail}: $${health.currentBalance.toFixed(2)} → $${health.calculatedBalance.toFixed(2)}`);
      
      await firestoreService.updateUserBalance(userId, health.calculatedBalance);
      
      // Add a transaction record for the fix
      await firestoreService.addBalanceTransaction({
        userId,
        type: 'refund',
        amount: health.calculatedBalance - health.currentBalance,
        description: 'Automatic balance correction',
        balanceAfter: health.calculatedBalance
      });

      return {
        fixed: true,
        oldBalance: health.currentBalance,
        newBalance: health.calculatedBalance
      };
    }

    return {
      fixed: false,
      oldBalance: health.currentBalance,
      newBalance: health.currentBalance
    };

  } catch (error) {
    console.error(`Auto-fix failed for user ${userId}:`, error);
    return {
      fixed: false,
      oldBalance: 0,
      newBalance: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Log transaction for debugging
 */
export function logTransaction(
  operation: string,
  userId: string,
  amount: number,
  success: boolean,
  details?: any
) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    operation,
    userId,
    amount,
    success,
    details
  };

  console.log(`📝 Transaction Log [${timestamp}]:`, logEntry);

  // In production, you might want to send this to a logging service
  // or store in a separate Firestore collection for analysis
}