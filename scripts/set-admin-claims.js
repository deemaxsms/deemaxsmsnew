#!/usr/bin/env node
// Script to set admin custom claims for specified emails.
// Usage: node scripts/set-admin-claims.js

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';

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

async function setAdminClaims(email) {
  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    console.log(`Set admin claim for ${email} (UID: ${user.uid})`);
  } catch (error) {
    console.error(`Error setting admin claim for ${email}:`, error.message);
  }
}

async function main() {
  initAdmin();
  const adminEmails = ['muhammednetrc@gmail.com', 'ogunlademichael3@gmail.com'];

  for (const email of adminEmails) {
    await setAdminClaims(email);
  }

  console.log('Done setting admin claims.');
  process.exit(0);
}

main();