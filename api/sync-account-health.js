import admin from 'firebase-admin';

// Initialize Admin SDK using your .env naming convention
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.VITE_PUBLIC_FIREBASE_PROJECT_ID || "sms-globe", 
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "User ID required" });

  try {
    const userRef = db.collection('users').doc(userId);
    const userBalanceRef = db.collection('user_balances').doc(userId);
    const txCollection = db.collection('balance_transactions');

    // Run as a transaction to ensure data integrity
    const result = await db.runTransaction(async (t) => {
      const userSnap = await t.get(userRef);
      if (!userSnap.exists) throw new Error("User profile does not exist");

      // Fetch all transactions for this specific user
      const txSnapshot = await t.get(txCollection.where('userId', '==', userId));
      
      let calculatedBalance = 0;
      let txCount = 0;

      txSnapshot.forEach(doc => {
        const tx = doc.data();
        txCount++;
        
        // Summing: Deposits are (+), Purchases are (-)
        const amount = Number(tx.amount || 0);
        calculatedBalance += amount;
      });

      // Safety check: Avoid negative balances during a sync
      const finalBalance = Math.max(0, calculatedBalance);
      const now = admin.firestore.FieldValue.serverTimestamp();

      // 1. Update the primary User document
      t.update(userRef, { 
        balance: finalBalance,
        lastSync: now,
        updatedAt: now,
        healthStatus: 'verified',
        auditInfo: {
          lastAuditTxCount: txCount,
          syncedAt: now
        }
      });

      // 2. Update the User Balance Stats collection (Crucial for UI consistency)
      t.update(userBalanceRef, {
        balanceUSD: finalBalance,
        lastTransactionAt: now,
        updatedAt: now
      });

      return { finalBalance, txCount };
    });

    return res.status(200).json({ 
      success: true, 
      newBalance: result.finalBalance,
      transactionsAudited: result.txCount
    });

  } catch (error) {
    console.error("CRITICAL: Account Health Sync Failed:", error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || "Internal Server Error during synchronization" 
    });
  }
}