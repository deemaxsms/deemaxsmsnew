import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Modernized Initialization:
 * Prioritizes Environment Variables (Vercel/Production)
 * Falls back to the new sms-globe JSON file
 */
function initAdmin() {
  // 1. Check for Environment Variables (Secure Method)
  if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.VITE_PUBLIC_FIREBASE_PROJECT_ID || "sms-globe",
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
      databaseURL: `https://${process.env.VITE_PUBLIC_FIREBASE_PROJECT_ID || 'sms-globe'}-default-rtdb.firebaseio.com`
    });
    console.log('✅ Initialized admin using Environment Variables');
    return;
  }

  // 2. Fallback: Local JSON file (matching your new download)
  const svcPath = join(__dirname, '../sms-globe-firebase-adminsdk-fbsvc-ba1d935918.json');
  
  if (existsSync(svcPath)) {
    const serviceAccount = JSON.parse(readFileSync(svcPath, 'utf8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com`
    });
    console.log('✅ Initialized admin with local service account JSON');
  } else {
    // 3. Last resort
    admin.initializeApp();
    console.log('⚠️  Initialized admin with default credentials');
  }
}

async function createBalanceCollection() {
  try {
    initAdmin();
    const db = admin.firestore();
    
    console.log('🚀 Setting up User Balances collection structure...');

    // We use a real-world sample structure that matches your Health Check logic
    const sampleBalance = {
      userId: 'setup_template',
      userEmail: 'admin@sms-globe.com',
      username: 'admin_template',
      balanceUSD: 0.00, 
      totalDepositedUSD: 0.00, 
      totalSpentUSD: 0.00, 
      currency: 'USD',
      lastDepositAt: admin.firestore.Timestamp.now(),
      lastTransactionAt: admin.firestore.Timestamp.now(),
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
      pendingDeposits: 0, 
      totalDepositsCount: 0,
      totalTransactionsCount: 0,
      referralEarningsUSD: 0.00,
      cashbackUSD: 0.00,
      useCashbackFirst: false,
      healthStatus: 'verified' // Added to match your new health check logic
    };

    // Add the template document
    await db.collection('user_balances').doc('template').set(sampleBalance);
    console.log('✅ Collection structure established.');

    // Optional: Keep the template for reference or delete it
    await db.collection('user_balances').doc('template').delete();
    console.log('🧹 Cleaned up template document.');

    console.log('🎉 Database is ready for the Transaction Health Check system!');

  } catch (error) {
    console.error('❌ Error during setup:', error.message);
  } finally {
    process.exit(0);
  }
}

createBalanceCollection();