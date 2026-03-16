/**
 * CRITICAL SECURITY AUDIT SCRIPT
 * 
 * This script audits all user balances and identifies:
 * 1. Users affected by the balance inflation bug
 * 2. Suspicious balance correction transactions
 * 3. Inconsistencies in transaction records
 * 
 * RUN THIS IMMEDIATELY to assess damage from the auto-fix bug
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(
    readFileSync('./deemax-3223e-firebase-adminsdk-qg4o1-cbfae26480.json', 'utf8')
  );
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function auditBalanceSecurity() {
  console.log('🚨 STARTING CRITICAL BALANCE SECURITY AUDIT');
  console.log('='.repeat(60));

  const issues = [];
  let totalUsersAudited = 0;
  let usersWithIssues = 0;

  try {
    // Get all users
    const usersSnapshot = await db.collection('users').get();
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      const currentBalance = userData.balance || 0;
      
      totalUsersAudited++;
      
      // Skip users with zero balance
      if (currentBalance === 0) continue;

      console.log(`\nAuditing user: ${userId} (Balance: $${currentBalance})`);

      // Get all transactions for this user
      const transactionsSnapshot = await db.collection('balance_transactions')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'asc')
        .get();

      const transactions = transactionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Calculate balance using CORRECT method
      let calculatedBalance = 0;
      let suspiciousTransactions = [];
      let correctionTransactions = [];

      for (const tx of transactions) {
        // Check for suspicious correction transactions
        if (tx.description && tx.description.includes('Balance correction')) {
          correctionTransactions.push({
            id: tx.id,
            amount: tx.amount,
            description: tx.description,
            createdAt: tx.createdAt?.toDate?.()?.toISOString() || 'Unknown'
          });
        }

        // Check for transactions with wrong signs
        if (tx.type === 'deposit' && tx.amount < 0) {
          suspiciousTransactions.push({
            id: tx.id,
            issue: 'Deposit with negative amount',
            amount: tx.amount,
            type: tx.type
          });
        }

        if (tx.type === 'purchase' && tx.amount > 0) {
          suspiciousTransactions.push({
            id: tx.id,
            issue: 'Purchase with positive amount',
            amount: tx.amount,
            type: tx.type
          });
        }

        // Calculate balance correctly
        if (tx.type === 'deposit' || tx.type === 'refund' || tx.type === 'referral_bonus') {
          calculatedBalance += Math.abs(tx.amount);
        } else if (tx.type === 'purchase' || tx.type === 'withdrawal') {
          calculatedBalance -= Math.abs(tx.amount);
        }
      }

      calculatedBalance = Math.max(0, calculatedBalance);
      const discrepancy = currentBalance - calculatedBalance;

      // Check for issues
      const userIssues = {
        userId,
        currentBalance,
        calculatedBalance,
        discrepancy,
        transactionCount: transactions.length,
        correctionTransactions,
        suspiciousTransactions,
        severity: 'LOW'
      };

      // Determine severity
      if (Math.abs(discrepancy) > 1000) {
        userIssues.severity = 'CRITICAL';
        usersWithIssues++;
      } else if (Math.abs(discrepancy) > 100) {
        userIssues.severity = 'HIGH';
        usersWithIssues++;
      } else if (Math.abs(discrepancy) > 10) {
        userIssues.severity = 'MEDIUM';
        usersWithIssues++;
      } else if (correctionTransactions.length > 0 || suspiciousTransactions.length > 0) {
        userIssues.severity = 'LOW';
        usersWithIssues++;
      }

      if (userIssues.severity !== 'LOW' || correctionTransactions.length > 0) {
        issues.push(userIssues);
        
        console.log(`  ⚠️  ${userIssues.severity} ISSUE DETECTED:`);
        console.log(`      Discrepancy: $${discrepancy.toFixed(2)}`);
        console.log(`      Corrections: ${correctionTransactions.length}`);
        console.log(`      Suspicious: ${suspiciousTransactions.length}`);
      }
    }

    // Generate report
    console.log('\n' + '='.repeat(60));
    console.log('🚨 SECURITY AUDIT REPORT');
    console.log('='.repeat(60));
    console.log(`Total users audited: ${totalUsersAudited}`);
    console.log(`Users with issues: ${usersWithIssues}`);
    console.log(`Critical issues: ${issues.filter(i => i.severity === 'CRITICAL').length}`);
    console.log(`High issues: ${issues.filter(i => i.severity === 'HIGH').length}`);
    console.log(`Medium issues: ${issues.filter(i => i.severity === 'MEDIUM').length}`);

    // Show critical cases
    const criticalIssues = issues.filter(i => i.severity === 'CRITICAL');
    if (criticalIssues.length > 0) {
      console.log('\n🚨 CRITICAL CASES (Likely affected by auto-fix bug):');
      for (const issue of criticalIssues) {
        console.log(`\nUser: ${issue.userId}`);
        console.log(`  Current Balance: $${issue.currentBalance}`);
        console.log(`  Should Be: $${issue.calculatedBalance}`);
        console.log(`  Discrepancy: $${issue.discrepancy.toFixed(2)}`);
        console.log(`  Correction Transactions: ${issue.correctionTransactions.length}`);
        
        if (issue.correctionTransactions.length > 0) {
          console.log('  Recent Corrections:');
          for (const correction of issue.correctionTransactions.slice(-3)) {
            console.log(`    - ${correction.createdAt}: $${correction.amount} (${correction.description})`);
          }
        }
      }
    }

    // Save detailed report
    const reportData = {
      auditDate: new Date().toISOString(),
      totalUsersAudited,
      usersWithIssues,
      issues: issues.map(issue => ({
        ...issue,
        // Limit transaction details to save space
        correctionTransactions: issue.correctionTransactions.slice(-5),
        suspiciousTransactions: issue.suspiciousTransactions.slice(-5)
      }))
    };

    await db.collection('security_audits').add(reportData);
    console.log('\n✅ Audit report saved to Firestore collection: security_audits');

    console.log('\n🔧 RECOMMENDED ACTIONS:');
    console.log('1. Manually review all CRITICAL cases');
    console.log('2. Contact affected users to explain the issue');
    console.log('3. Manually correct balances based on transaction history');
    console.log('4. Implement the security fixes provided');
    console.log('5. Add monitoring to prevent future issues');

  } catch (error) {
    console.error('❌ Audit failed:', error);
  }
}

// Run the audit
auditBalanceSecurity().then(() => {
  console.log('\n🏁 Security audit completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Audit crashed:', error);
  process.exit(1);
});