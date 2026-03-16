import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serviceAccount = JSON.parse(readFileSync(join(__dirname, '../deemax-3223e-firebase-adminsdk-qg4o1-8afdc5d3b8.json'), 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://deemax-3223e-default-rtdb.firebaseio.com'
});

const db = admin.firestore();

async function createBalanceCollection() {
  try {
    console.log('Creating Balance collection structure...');

    // Create a sample balance document to establish the collection
    const sampleBalance = {
      id: 'sample_balance',
      userId: 'sample_user_id',
      userEmail: 'user@example.com',
      username: 'sample_user',
      balanceUSD: 10.00, // Current balance in USD
      totalDepositedUSD: 10.00, // Total deposited in USD
      totalSpentUSD: 0.00, // Total spent in USD
      currency: 'USD', // Primary currency
      lastDepositAt: admin.firestore.Timestamp.now(),
      lastTransactionAt: admin.firestore.Timestamp.now(),
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
      // Additional fields for tracking
      pendingDeposits: 0, // Number of pending deposits
      totalDepositsCount: 1, // Total number of successful deposits
      totalTransactionsCount: 1, // Total number of balance transactions
      referralEarningsUSD: 0.00, // Earnings from referrals
      cashbackUSD: 0.00, // Cashback balance
      useCashbackFirst: false, // Preference for using cashback
    };

    // Add the sample document
    await db.collection('user_balances').doc('sample_balance').set(sampleBalance);

    console.log('Balance collection created successfully!');
    console.log('Sample document added to establish collection structure.');

    // Clean up sample document
    await db.collection('user_balances').doc('sample_balance').delete();
    console.log('Sample document cleaned up.');

    console.log('✅ User Balances collection is ready for use!');

  } catch (error) {
    console.error('Error creating Balance collection:', error);
  } finally {
    process.exit(0);
  }
}

createBalanceCollection();