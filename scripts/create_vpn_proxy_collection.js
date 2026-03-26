#!/usr/bin/env node
// Updated Script to create consolidated VPN and Proxy products with pricing tiers.

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';

function initAdmin() {
  if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.VITE_PUBLIC_FIREBASE_PROJECT_ID || "sms-globe",
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
    }
    return;
  }

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const svcPath = path.resolve(__dirname, '..', 'sms-globe-firebase-adminsdk-fbsvc-ba1d935918.json');
  
  if (fs.existsSync(svcPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(svcPath, 'utf8'));
    if (!admin.apps.length) {
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    }
  } else {
    if (!admin.apps.length) admin.initializeApp();
  }
}

async function main() {
  initAdmin();
  const db = admin.firestore();

  const consolidatedSamples = [
    {
      name: 'ExpressVPN Premium',
      slug: 'expressvpn-premium',
      category: 'vpn',
      provider: 'ExpressVPN',
      description: 'Ultra-fast VPN with top-tier security.',
      isActive: true,
      stock: 50,
      region: 'Global',
      username: 'admin@express-service.com', // Sample credential
      password: 'encrypted_pass_123',
      pricingTiers: [
        { duration: '1 Month', price: 12.95 },
        { duration: '6 Months', price: 59.95 },
        { duration: '1 Year', price: 99.95 }
      ],
      features: ['High speed', '30-day money back', '5 Devices'],
      vpnProtocol: 'Lightway / OpenVPN',
      deviceLimit: 5,
      logPolicy: 'No-logs policy',
      imageUrl: 'express-vpn.webp',
      setupInstructions: 'Download the app and login with the provided credentials.'
    },
    {
      name: 'NordVPN Secure',
      slug: 'nordvpn-secure',
      category: 'vpn',
      provider: 'NordVPN',
      description: 'Advanced security features and Double VPN.',
      isActive: true,
      stock: 100,
      region: 'Global',
      username: '', 
      password: '',
      pricingTiers: [
        { duration: '1 Month', price: 11.95 },
        { duration: '1 Year', price: 79.95 }
      ],
      features: ['Double VPN', 'CyberSec', '6 Devices'],
      vpnProtocol: 'NordLynx',
      deviceLimit: 6,
      logPolicy: 'Verified No-logs',
      imageUrl: 'nord-vpn.webp'
    },
    {
      name: 'PIA S5 Proxy',
      slug: 'pia-s5-proxy',
      category: 'proxy',
      provider: 'Private Internet Access',
      description: 'High-quality S5 Proxies for residential use.',
      isActive: true,
      stock: 200,
      region: 'USA/Europe',
      pricingTiers: [
        { duration: '30 Days', price: 15.95 },
        { duration: '90 Days', price: 40.00 }
      ],
      proxyType: 'SOCKS5',
      ipType: 'Residential',
      bandwidth: 'Unlimited',
      authMethod: 'User/Pass',
      imageUrl: 'pia-s5.webp'
    }
  ];

  try {
    const collectionName = 'product_listings';
    for (const item of consolidatedSamples) {
      const ref = await db.collection(collectionName).add({
        ...item,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`✅ Created Product: ${item.name} (ID: ${ref.id})`);
    }
  } catch (err) {
    console.error('❌ Error creating products:', err);
  } finally {
    process.exit(0);
  }
}

main();