#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const admin = require('firebase-admin');

function initAdmin() {
  // 1. PRIORITY: Check for Environment Variables (Vercel/Production mode)
  if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.VITE_PUBLIC_FIREBASE_PROJECT_ID|| "sms-globe",
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // The .replace ensures that Vercel's string format is converted to real newlines
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
      console.log('✅ Initialized admin using Environment Variables');
      return;
    } catch (err) {
      console.error('❌ Failed to initialize with Env Vars:', err.message);
    }
  }

  // 2. FALLBACK: Look for the local JSON file (Local Dev mode)
  // Note: Updated path to check for both the old name and a generic name
  const svcPath = path.resolve(__dirname, '..', 'sms-globe-firebase-adminsdk-fbsvc-ba1d935918.json');
  
  if (fs.existsSync(svcPath)) {
    const serviceAccount = require(svcPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('📁 Initialized admin using Local Service Account JSON');
  } else {
    // 3. LAST RESORT: Try default credentials
    try {
      admin.initializeApp();
      console.log('⚠️ Initialized admin with default credentials');
    } catch (e) {
      console.error('💥 Critical: Could not find any Firebase credentials!');
      process.exit(1);
    }
  }
}

async function main() {
  initAdmin();
  const db = admin.firestore();
  const argv = process.argv.slice(2);
  const cmd = argv[0];

  if (!cmd) {
    console.log('Usage: node scripts/firebase-admin.js <get|set|add|delete> <path> [json]');
    process.exit(1);
  }

  const target = argv[1];
  const payload = argv[2] ? JSON.parse(argv[2]) : null;

  try {
    if (cmd === 'get') {
      const [col, id] = target.split('/');
      if (!id) throw new Error('Use collection/docId');
      const doc = await db.collection(col).doc(id).get();
      console.log(doc.exists ? doc.data() : 'Not found');
    } else if (cmd === 'set') {
      const [col, id] = target.split('/');
      if (!id) throw new Error('Use collection/docId');
      await db.collection(col).doc(id).set(payload, { merge: true });
      console.log('✅ Document updated successfully');
    } else if (cmd === 'add') {
      const col = target;
      const docRef = await db.collection(col).add(payload);
      console.log('✅ Added with ID:', docRef.id);
    } else if (cmd === 'delete') {
      const [col, id] = target.split('/');
      await db.collection(col).doc(id).delete();
      console.log('🗑️ Deleted successfully');
    } else {
      console.log('Unknown command:', cmd);
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    process.exit(0);
  }
}

main();