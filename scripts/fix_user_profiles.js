#!/usr/bin/env node
// Script to fix user profile balance inconsistencies
// This script recalculates user balances from transaction history
// Usage: node scripts/fix_user_profiles.js

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';

function initAdmin() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const svcPath = path.resolve(__dirname, '..', 'deemax-3223e-firebase-adminsdk-qg4o1-8afdc5d3b8.json');
  if (fs.existsSync(svcPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(svcPath, 'utf8'));
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    console.log('✅ Initialized admin with service account');
  } else {
    admin.initializeApp();
    console.log('✅ Initialized admin with default credentials');
  }
}

async function fixUserBalance(userId, userEmail) {
  const db = admin.firestore();
  
  try {
    console.log(`\n🔍 Checking user: ${userEmail} (${userId})`);
    
    // Get current user profile
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      console.log(`❌ User profile not found`);
      return;
    }
    
    const userData = userDoc.data();
    const currentBalance = userData.balance || 0;
    console.log(`💰 Current balance: $${currentBalance.toFixed(2)}`);
    
    // Get all transactions for this user
    const transactionsQuery = await db.collection('balance_transactions')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'asc')
      .get();
    
    console.log(`📊 Found ${transactionsQuery.size} transactions`);
    
    // Calculate correct balance from transaction history
    let calculatedBalance = 0;
    const transactions = [];
    
    transactionsQuery.forEach(doc => {
      const tx = doc.data();
      transactions.push({
        id: doc.id,
        type: tx.type,
        amount: tx.amount,
        description: tx.description,
        createdAt: tx.createdAt,
        balanceAfter: tx.balanceAfter
      });
      
      // Add positive transactions (deposits, refunds, referral bonuses)
      if (tx.type === 'deposit' || tx.type === 'referral_bonus' || tx.type === 'refund') {
        calculatedBalance += Math.abs(tx.amount);
      }
      // Subtract negative transactions (purchases, withdrawals)
      else if (tx.type === 'purchase' || tx.type === 'withdrawal') {
        calculatedBalance -= Math.abs(tx.amount);
      }
    });
    
    calculatedBalance = Math.max(0, calculatedBalance); // Ensure non-negative
    console.log(`🧮 Calculated balance: $${calculatedBalance.toFixed(2)}`);
    
    // Check for discrepancy
    const discrepancy = Math.abs(currentBalance - calculatedBalance);
    if (discrepancy > 0.01) { // Allow for small floating point differences
      console.log(`⚠️  DISCREPANCY FOUND: $${discrepancy.toFixed(2)}`);
      console.log(`   Current: $${currentBalance.toFixed(2)}`);
      console.log(`   Should be: $${calculatedBalance.toFixed(2)}`);
      
      // Update the user's balance
      await db.collection('users').doc(userId).update({
        balance: calculatedBalance,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        balanceFixedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`✅ Balance corrected: $${currentBalance.toFixed(2)} → $${calculatedBalance.toFixed(2)}`);
      
      // Also update user_balances collection if it exists
      try {
        const userBalanceDoc = await db.collection('user_balances').doc(userId).get();
        if (userBalanceDoc.exists) {
          await db.collection('user_balances').doc(userId).update({
            balanceUSD: calculatedBalance,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            balanceFixedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          console.log(`✅ user_balances collection also updated`);
        }
      } catch (balanceError) {
        console.warn(`⚠️  Could not update user_balances collection:`, balanceError.message);
      }
      
      return { fixed: true, oldBalance: currentBalance, newBalance: calculatedBalance };
    } else {
      console.log(`✅ Balance is correct`);
      return { fixed: false, balance: currentBalance };
    }
    
  } catch (error) {
    console.error(`❌ Error fixing balance for ${userEmail}:`, error);
    return { error: error.message };
  }
}

async function main() {
  initAdmin();
  const db = admin.firestore();
  
  console.log('🔧 Starting user balance fix script...\n');
  
  try {
    // Get all users
    const usersQuery = await db.collection('users').get();
    console.log(`👥 Found ${usersQuery.size} users to check\n`);
    
    const results = {
      total: usersQuery.size,
      fixed: 0,
      correct: 0,
      errors: 0,
      fixedUsers: []
    };
    
    // Process each user
    for (const userDoc of usersQuery.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;
      const userEmail = userData.email || 'unknown@email.com';
      
      const result = await fixUserBalance(userId, userEmail);
      
      if (result.error) {
        results.errors++;
      } else if (result.fixed) {
        results.fixed++;
        results.fixedUsers.push({
          email: userEmail,
          oldBalance: result.oldBalance,
          newBalance: result.newBalance
        });
      } else {
        results.correct++;
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📋 BALANCE FIX SUMMARY');
    console.log('='.repeat(50));
    console.log(`👥 Total users checked: ${results.total}`);
    console.log(`✅ Balances already correct: ${results.correct}`);
    console.log(`🔧 Balances fixed: ${results.fixed}`);
    console.log(`❌ Errors encountered: ${results.errors}`);
    
    if (results.fixedUsers.length > 0) {
      console.log('\n🔧 USERS WITH FIXED BALANCES:');
      results.fixedUsers.forEach(user => {
        console.log(`   ${user.email}: $${user.oldBalance.toFixed(2)} → $${user.newBalance.toFixed(2)}`);
      });
    }
    
    console.log('\n✅ Balance fix script completed successfully!');
    
  } catch (error) {
    console.error('❌ Script failed:', error);
  } finally {
    process.exit(0);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  console.log('🚀 Starting balance fix script...');
  main().catch(console.error);
}

export { fixUserBalance };