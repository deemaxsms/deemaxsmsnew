// api/sync-account-health.js
import { db } from "../lib/firebase-admin"; // Ensure you have admin setup

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { userId } = req.body;

  try {
    const userRef = db.collection('users').doc(userId);
    const transactionsSnapshot = await db.collection('transactions')
      .where('userId', '==', userId)
      .get();

    let calculatedBalance = 0;
    transactionsSnapshot.forEach(doc => {
      calculatedBalance += doc.data().amount;
    });

    // Atomic update to sync the balance
    await userRef.update({ 
      balance: calculatedBalance,
      lastSync: new Date().toISOString()
    });

    return res.status(200).json({ success: true, newBalance: calculatedBalance });
  } catch (error) {
    console.error("Sync Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}