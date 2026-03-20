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
  // 1. Check for Secret Environment Variables (Production/Vercel)
  if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.VITE_PUBLIC_FIREBASE_PROJECT_ID || "sms-globe",
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // Convert string newlines back to actual newlines for the RSA key
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
        databaseURL: `https://${process.env.VITE_PUBLIC_FIREBASE_PROJECT_ID || 'sms-globe'}-default-rtdb.firebaseio.com`
      });
    }
    console.log('✅ Initialized admin using Environment Variables');
    return;
  }

  // 2. Fallback: Local JSON file (Updated to your new sms-globe key)
  const svcPath = join(__dirname, '../sms-globe-firebase-adminsdk-fbsvc-ba1d935918.json');
  
  if (existsSync(svcPath)) {
    const serviceAccount = JSON.parse(readFileSync(svcPath, 'utf8'));
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com`
      });
    }
    console.log('✅ Initialized admin with local sms-globe service account JSON');
  } else {
    // 3. Final Fallback
    if (!admin.apps.length) admin.initializeApp();
    console.log('⚠️  Initialized admin with default credentials (verify your environment)');
  }
}

async function createBalanceCollection() {
  try {
    initAdmin();
    const db = admin.firestore();

    console.log('🚀 Setting up "user_balances" collection structure...');

    // We use a structured template that includes the healthStatus field
    const templateBalance = {
      userId: 'template_id',
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
      healthStatus: 'verified' // Standardizing with your new Health Check system
    };

    // Add the template document to "kickstart" the collection
    await db.collection('user_balances').doc('template').set(templateBalance);
    console.log('✅ Collection structure established successfully.');

    // Cleanup: Delete the template so you don't have dummy data in production
    await db.collection('user_balances').doc('template').delete();
    console.log('🧹 Template document cleaned up.');

    console.log('🎉 Database is fully prepared for Transaction Health Sync!');

  } catch (error) {
    console.error('❌ Error creating collection:', error.message);
  } finally {
    process.exit(0);
  }
}

createBalanceCollection();