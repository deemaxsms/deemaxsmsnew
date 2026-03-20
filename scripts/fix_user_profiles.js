#!/usr/bin/env node
// Script to fix user profile balance inconsistencies
// Recalculates user balances from transaction history using Admin credentials
// Usage: node scripts/fix_user_profiles.js

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';

/**
 * Initializes Firebase Admin using either Environment Variables 
 * or the local Service Account JSON file.
 */
function initAdmin() {
  // 1. Check for Environment Variables (Vercel/Production mode)
  if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.VITE_PUBLIC_FIREBASE_PROJECT_ID || "sms-globe",
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // Convert string newlines back to actual newlines for the RSA key
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
    }
    console.log('✅ Initialized admin using Environment Variables');
    return;
  }

  // 2. Fallback: Check for the local JSON file
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const svcPath = path.resolve(__dirname, '..', 'sms-globe-firebase-adminsdk-fbsvc-ba1d935918.json');
  
  if (fs.existsSync(svcPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(svcPath, 'utf8'));
    if (!admin.apps.length) {
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    }
    console.log('✅ Initialized admin with local service account JSON');
  } else {
    // 3. Last resort fallback
    if (!admin.apps.length) {
      admin.initializeApp();
    }
    console.log('⚠️  Initialized admin with default credentials (check your auth)');
  }
}

/**
 * Recalculates and fixes the balance for a single user based on balance_transactions
 */
async function fixUserBalance(userId, userEmail) {
  const db = admin.firestore();
  
  try {
    console.log(`\n🔍 Checking user: ${userEmail} (${userId})`);
    
    // Get current user profile
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      console.log(`❌ User profile not found`);
      return { error: 'Not found' };
    }
    
    const userData = userDoc.data();
    const currentBalance = userData.balance || 0;
    console.log(`💰 Current Profile Balance: $${currentBalance.toFixed(2)}`);
    
    // Get all transactions for this user
    const transactionsQuery = await db.collection('balance_transactions')
      .where('userId', '==', userId)
      .get();
    
    console.log(`📊 Found ${transactionsQuery.size} transactions in record`);
    
    // Calculate correct balance from transaction history
    let calculatedBalance = 0;
    
    transactionsQuery.forEach(doc => {
      const tx = doc.data();
      const amount = Math.abs(tx.amount || 0);
      
      // LOGIC: Deposits/Refunds ADD, Purchases/Withdrawals SUBTRACT
      if (['deposit', 'referral_bonus', 'refund'].includes(tx.type)) {
        calculatedBalance += amount;
      } else if (['purchase', 'withdrawal'].includes(tx.type)) {
        calculatedBalance -= amount;
      }
    });
    
    calculatedBalance = Math.max(0, calculatedBalance); // Ensure balance isn't negative
    console.log(`🧮 Calculated from History: $${calculatedBalance.toFixed(2)}`);
    
    // Check for discrepancy (allowing for tiny floating point errors)
    const discrepancy = Math.abs(currentBalance - calculatedBalance);
    
    if (discrepancy > 0.01) { 
      console.log(`⚠️  DISCREPANCY FOUND: $${discrepancy.toFixed(2)}`);
      
      // Update the user's primary profile
      const updateData = {
        balance: calculatedBalance,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        balanceFixedAt: admin.firestore.FieldValue.serverTimestamp(),
        healthStatus: 'verified' // This makes the Health Check turn GREEN in the UI
      };

      await db.collection('users').doc(userId).update(updateData);
      console.log(`✅ Profile balance corrected`);
      
      // Sync user_balances collection if it exists
      try {
        const userBalanceRef = db.collection('user_balances').doc(userId);
        const userBalanceDoc = await userBalanceRef.get();
        if (userBalanceDoc.exists) {
          await userBalanceRef.update({
            balanceUSD: calculatedBalance,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          console.log(`✅ user_balances collection synced`);
        }
      } catch (err) {
        console.warn(`⚠️  Skipped user_balances update: ${err.message}`);
      }
      
      return { fixed: true, oldBalance: currentBalance, newBalance: calculatedBalance };
    } else {
      // Even if balance is correct, ensure healthStatus is marked 'verified'
      if (userData.healthStatus !== 'verified') {
        await db.collection('users').doc(userId).update({ healthStatus: 'verified' });
      }
      console.log(`✅ Balance is correct`);
      return { fixed: false, balance: currentBalance };
    }
    
  } catch (error) {
    console.error(`❌ Error for ${userEmail}:`, error.message);
    return { error: error.message };
  }
}

async function main() {
  initAdmin();
  const db = admin.firestore();
  
  console.log('🔧 Starting global balance reconciliation...\n');
  
  try {
    const usersQuery = await db.collection('users').get();
    console.log(`👥 Found ${usersQuery.size} users to verify\n`);
    
    const stats = { total: usersQuery.size, fixed: 0, correct: 0, errors: 0, fixedUsers: [] };
    
    for (const userDoc of usersQuery.docs) {
      const userData = userDoc.data();
      const result = await fixUserBalance(userDoc.id, userData.email || 'unknown@user.com');
      
      if (result.error) stats.errors++;
      else if (result.fixed) {
        stats.fixed++;
        stats.fixedUsers.push({ email: userData.email, from: result.oldBalance, to: result.newBalance });
      } else stats.correct++;
      
      // Avoid hitting Firebase rate limits on large user bases
      await new Promise(r => setTimeout(r, 50));
    }
    
    console.log('\n' + '='.repeat(30));
    console.log('📋 FINAL REPORT');
    console.log(`✅ Healthy: ${stats.correct}`);
    console.log(`🔧 Fixed:   ${stats.fixed}`);
    console.log(`❌ Failed:  ${stats.errors}`);
    console.log('='.repeat(30));

    if (stats.fixedUsers.length > 0) {
      console.log('\nModified Accounts:');
      stats.fixedUsers.forEach(u => console.log(` - ${u.email}: $${u.from} -> $${u.to}`));
    }
    
  } catch (error) {
    console.error('❌ Script execution failed:', error);
  } finally {
    process.exit(0);
  }
}

// Execution check
const isMain = import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`;
if (isMain) {
  main().catch(console.error);
}

export { fixUserBalance };