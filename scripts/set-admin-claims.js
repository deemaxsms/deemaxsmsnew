#!/usr/bin/env node
// Script to set admin custom claims for specified emails.
// Usage: node scripts/set-admin-claims.js

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
    console.log('Initialized admin with service account');
  } else {
    admin.initializeApp();
    console.log('Initialized admin with default credentials');
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