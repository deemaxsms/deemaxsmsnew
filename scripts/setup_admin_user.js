// Admin User Setup Script
// This script helps create admin users in Firestore using Firebase Admin SDK

import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize Firebase Admin
function initAdmin() {
  const svcPath = path.resolve(__dirname, '..', 'deemax-3223e-firebase-adminsdk-qg4o1-77de73f808.json');
  if (fs.existsSync(svcPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(svcPath, 'utf8'));
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    console.log('Initialized admin with service account');
  } else {
    admin.initializeApp();
    console.log('Initialized admin with default credentials');
  }
}

// Allowed admin emails
const ALLOWED_ADMIN_EMAILS = [
  'muhammednetr@gmail.com',
  'ola@gmail.com',
  'olayemimuhammed2020@gmail.com',
  'smsglobe01@gmail.com'
];

async function createAdminUser(email, password, displayName) {
  try {
    console.log(`Creating admin user for: ${email}`);

    // Check if email is authorized
    if (!ALLOWED_ADMIN_EMAILS.includes(email)) {
      throw new Error('Email not authorized for admin access');
    }

    console.log('Email authorized, creating user...');
    
    // Create user account
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: displayName,
      emailVerified: true,
    });

    console.log(`User account created with UID: ${userRecord.uid}`);

    // Set custom claims for admin
    await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true });

    console.log('Custom claims set');

    // Create admin profile in Firestore
    const db = admin.firestore();
    await db.collection('users').doc(userRecord.uid).set({
      email: email,
      displayName: displayName,
      isAdmin: true,
      adminRole: 'admin',
      adminCreatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      balance: 0,
      suspended: false
    });

    console.log(`Admin profile created successfully for ${email}`);
    return userRecord;
    
  } catch (error) {
    console.error('Error creating admin user:', error.message);
    console.error('Full error:', error);
    throw error;
  }
}

async function setupExistingUserAsAdmin(email) {
  try {
    console.log(`Setting up existing user as admin: ${email}`);
    
    // Check if email is authorized
    if (!ALLOWED_ADMIN_EMAILS.includes(email)) {
      throw new Error('Email not authorized for admin access');
    }

    // Get user by email
    const userRecord = await admin.auth().getUserByEmail(email);

    console.log(`Found user with UID: ${userRecord.uid}`);

    // Set custom claims for admin
    await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true });

    // Update user profile to admin
    const db = admin.firestore();
    await db.collection('users').doc(userRecord.uid).set({
      email: email,
      displayName: userRecord.displayName || email.split('@')[0],
      isAdmin: true,
      adminRole: 'admin',
      adminCreatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log(`Admin privileges granted to ${email}`);
    return userRecord;
    
  } catch (error) {
    console.error('Error setting up admin user:', error);
    throw error;
  }
}

// Main execution
async function main() {
  initAdmin();

  // Example usage - modify as needed
  const email = process.argv[2];
  const password = process.argv[3];
  const displayName = process.argv[4] || email.split('@')[0];

  if (!email) {
    console.log('Usage: node scripts/setup_admin_user.js <email> <password> [displayName]');
    console.log('Example: node scripts/setup_admin_user.js muhammednetr@gmail.com mypassword Mohammed');
    process.exit(1);
  }

  try {
    // Try to create new user first
    await createAdminUser(email, password, displayName);
    console.log('Admin user setup completed successfully');
  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      console.log('User already exists, setting up as admin...');
      try {
        await setupExistingUserAsAdmin(email);
        console.log('Existing user setup as admin successfully');
      } catch (setupError) {
        console.error('Failed to setup existing user as admin:', setupError.message);
        process.exit(1);
      }
    } else {
      console.error('Failed to setup admin user:', error.message);
      process.exit(1);
    }
  }
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}

export { createAdminUser, setupExistingUserAsAdmin };