/**
 * CRITICAL SECURITY AUDIT SCRIPT
 * File: scripts/audit_balance_security.js
 * * This script audits all user balances and identifies:
 * 1. Users affected by the balance inflation bug
 * 2. Suspicious balance correction transactions
 * 3. Inconsistencies in transaction records
 */

import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Initializes Admin SDK by prioritizing Environment Variables
 * and falling back to the sms-globe JSON file.
 */
function initAdmin() {
  if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID || "sms-globe",
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
    }
    console.log('🛡️  Audit initialized via Environment Variables');
    return;
  }

  const svcPath = join(__dirname, '..', 'sms-globe-firebase-adminsdk-fbsvc-ba1d935918.json');
  
  if (existsSync(svcPath)) {
    const serviceAccount = JSON.parse(readFileSync(svcPath, 'utf8'));
    if (!admin.apps.length) {
      admin.initializeApp({ 
        credential: admin.credential.cert(serviceAccount) 
      });
    }
    console.log('🛡️  Audit initialized via Local Service Account JSON');
  } else {
    if (!admin.apps.length) admin.initializeApp();
    console.log('⚠️  Audit initialized with default credentials');
  }
}

async function auditBalanceSecurity() {
  console.log('\n🚨 STARTING CRITICAL BALANCE SECURITY AUDIT');
  console.log('='.repeat(60));

  initAdmin();
  const db = admin.firestore();

  const issues = [];
  let totalUsersAudited = 0;
  let usersWithIssues = 0;

  try {
    const usersSnapshot = await db.collection('users').get();
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      const currentBalance = userData.balance || 0;
      const userEmail = userData.email || 'unknown@user.com';
      
      totalUsersAudited++;
      
      // Get all transactions for this user
      const transactionsSnapshot = await db.collection('balance_transactions')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'asc')
        .get();

      const transactions = transactionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      let calculatedBalance = 0;
      let suspiciousTransactions = [];
      let correctionTransactions = [];

      for (const tx of transactions) {
        const desc = tx.description?.toLowerCase() || '';
        
        // Detect manual or buggy correction entries
        if (desc.includes('correction') || desc.includes('fixed')) {
          correctionTransactions.push({
            id: tx.id,
            amount: tx.amount,
            description: tx.description,
            createdAt: tx.createdAt?.toDate?.()?.toISOString() || 'Unknown'
          });
        }

        // Logic Integrity Checks
        if (tx.type === 'deposit' && tx.amount < 0) {
          suspiciousTransactions.push({ id: tx.id, issue: 'Negative Deposit', amount: tx.amount });
        }
        if (tx.type === 'purchase' && tx.amount > 0) {
          suspiciousTransactions.push({ id: tx.id, issue: 'Positive Purchase', amount: tx.amount });
        }

        // Calculation using absolute value logic to prevent math direction errors
        const absAmount = Math.abs(tx.amount || 0);
        if (['deposit', 'refund', 'referral_bonus'].includes(tx.type)) {
          calculatedBalance += absAmount;
        } else if (['purchase', 'withdrawal'].includes(tx.type)) {
          calculatedBalance -= absAmount;
        }
      }

      calculatedBalance = Math.max(0, calculatedBalance);
      const diff = currentBalance - calculatedBalance;
      const absoluteDiff = Math.abs(diff);

      // Flag users with significant discrepancies or history of corrections
      if (absoluteDiff > 0.01 || correctionTransactions.length > 0) {
        usersWithIssues++;
        let severity = 'LOW';
        if (absoluteDiff > 500) severity = 'CRITICAL';
        else if (absoluteDiff > 50) severity = 'HIGH';
        else if (absoluteDiff > 5) severity = 'MEDIUM';

        const userIssue = {
          userId,
          userEmail,
          currentBalance: Number(currentBalance.toFixed(2)),
          calculatedBalance: Number(calculatedBalance.toFixed(2)),
          discrepancy: Number(diff.toFixed(2)),
          severity,
          correctionCount: correctionTransactions.length,
          suspiciousCount: suspiciousTransactions.length
        };

        issues.push(userIssue);
        console.log(`[${severity}] ${userEmail.padEnd(25)} | Current: $${currentBalance.toFixed(2).padStart(8)} | Should Be: $${calculatedBalance.toFixed(2).padStart(8)}`);
      }
    }

    // Save summary report to Firestore for record-keeping
    const reportSummary = {
      auditDate: admin.firestore.FieldValue.serverTimestamp(),
      totalAudited: totalUsersAudited,
      totalWithIssues: usersWithIssues,
      criticalCount: issues.filter(i => i.severity === 'CRITICAL').length,
      highCount: issues.filter(i => i.severity === 'HIGH').length,
      issueDetails: issues.slice(0, 50) // Store top 50 samples in the document
    };

    await db.collection('security_audits').add(reportSummary);
    
    console.log('\n' + '='.repeat(60));
    console.log('🚨 AUDIT COMPLETE');
    console.log(`Total Users Audited: ${totalUsersAudited}`);
    console.log(`Users with Issues:   ${usersWithIssues}`);
    console.log('='.repeat(60));
    console.log('✅ Detailed report saved to Firestore collection: "security_audits"');

  } catch (error) {
    console.error('❌ Audit Failed:', error.message);
  }
}

auditBalanceSecurity().then(() => {
  process.exit(0);
});