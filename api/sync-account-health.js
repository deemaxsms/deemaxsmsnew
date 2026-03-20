import admin from 'firebase-admin';

// Initialize Admin SDK using your .env naming convention
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      // Using the exact name from your .env
      projectId: process.env.VITE_PUBLIC_FIREBASE_PROJECT_ID || "sms-globe", 
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // The Private Key must be set in Vercel/Environment, not the public .env
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  const { userId } = req.body;

  try {
    const userRef = db.collection('users').doc(userId);
    
    // 1. USE THE COLLECTION NAME FROM YOUR AUDIT SCRIPT
    const txSnapshot = await db.collection('balance_transactions')
      .where('userId', '==', userId)
      .get();

    let calculatedBalance = 0;

    // 2. APPLY THE "DEPOSIT VS PURCHASE" LOGIC
    txSnapshot.forEach(doc => {
      const tx = doc.data();
      const amount = Math.abs(tx.amount || 0);
      
      if (['deposit', 'refund', 'referral_bonus'].includes(tx.type)) {
        calculatedBalance += amount;
      } else if (['purchase', 'withdrawal'].includes(tx.type)) {
        calculatedBalance -= amount;
      }
    });

    const finalBalance = Math.max(0, calculatedBalance);

    // 3. SECURE UPDATE (Bypasses Firestore Rules)
    await userRef.update({ 
      balance: finalBalance,
      lastSync: new Date().toISOString(),
      healthStatus: 'verified'
    });

    return res.status(200).json({ 
      success: true, 
      newBalance: finalBalance,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Admin Sync Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}