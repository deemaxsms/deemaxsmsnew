#!/usr/bin/env node
// Script to create sample vpn and proxy products in `product_listings` collection.
// Usage: node scripts/create_vpn_proxy_collection.js

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

async function main() {
  initAdmin();
  const db = admin.firestore();

  const samples = [
    // ExpressVPN products
    {
      category: 'vpn', name: 'ExpressVPN 1 Month', slug: 'expressvpn-1m', description: 'ExpressVPN subscription for 1 month', price: 12.95, currency: 'USD', features: ['High speed', '30-day money back'], duration: '1 month', provider: 'ExpressVPN', imageFilename: 'express-vpn.webp', outOfStock: false, isActive: true, link: ''
    },
    { category: 'vpn', name: 'ExpressVPN 6 Months', slug: 'expressvpn-6m', description: 'ExpressVPN subscription for 6 months', price: 59.95, currency: 'USD', features: ['High speed', '30-day money back', 'Save 25%'], duration: '6 months', provider: 'ExpressVPN', imageFilename: 'express-vpn.webp', outOfStock: false, isActive: true, link: '' },
    { category: 'vpn', name: 'ExpressVPN 1 Year', slug: 'expressvpn-1y', description: 'ExpressVPN subscription for 1 year', price: 99.95, currency: 'USD', features: ['High speed', '30-day money back', 'Save 35%'], duration: '1 year', provider: 'ExpressVPN', imageFilename: 'express-vpn.webp', outOfStock: false, isActive: true, link: '' },

    // NordVPN products
    { category: 'vpn', name: 'NordVPN 1 Month', slug: 'nordvpn-1m', description: 'NordVPN plan for 1 month', price: 11.95, currency: 'USD', features: ['Double VPN'], duration: '1 month', provider: 'NordVPN', imageFilename: 'nord-vpn.webp', outOfStock: false, isActive: true, link: '' },
    { category: 'vpn', name: 'NordVPN 1 Year', slug: 'nordvpn-1y', description: 'NordVPN plan for 1 year', price: 79.95, currency: 'USD', features: ['Double VPN', 'Save 50%'], duration: '1 year', provider: 'NordVPN', imageFilename: 'nord-vpn.webp', outOfStock: false, isActive: true, link: '' },

    // Surfshark products
    { category: 'vpn', name: 'Surfshark 1 Month', slug: 'surfshark-1m', description: 'Surfshark VPN plan for 1 month', price: 12.95, currency: 'USD', features: ['Unlimited devices'], duration: '1 month', provider: 'Surfshark', imageFilename: 'surf-shark.webp', outOfStock: false, isActive: true, link: '' },
    { category: 'vpn', name: 'Surfshark 6 Months', slug: 'surfshark-6m', description: 'Surfshark VPN plan for 6 months', price: 47.95, currency: 'USD', features: ['Unlimited devices', 'Save 20%'], duration: '6 months', provider: 'Surfshark', imageFilename: 'surf-shark.webp', outOfStock: true, isActive: true, link: '' },

    // CyberGhost products
    { category: 'vpn', name: 'CyberGhost 1 Month', slug: 'cyberghost-1m', description: 'CyberGhost VPN for 1 month', price: 10.95, currency: 'USD', features: ['Streaming servers'], duration: '1 month', provider: 'CyberGhost', imageFilename: 'cyber-ghost.webp', outOfStock: false, isActive: true, link: '' },
    { category: 'vpn', name: 'CyberGhost 3 Months', slug: 'cyberghost-3m', description: 'CyberGhost VPN for 3 months', price: 29.95, currency: 'USD', features: ['Streaming servers', 'Save 30%'], duration: '3 months', provider: 'CyberGhost', imageFilename: 'cyber-ghost.webp', outOfStock: false, isActive: true, link: '' },

    // PIA products
    { category: 'proxy', name: 'PIA S5 Proxy 30 Days', slug: 'pia-s5-30d', description: 'PIA S5 Proxy for 30 days', price: 15.95, currency: 'USD', features: ['Dedicated IPs'], duration: '30 days', provider: 'Private Internet Access', imageFilename: 'pia-s5.webp', outOfStock: false, isActive: true, link: '' },
    { category: 'proxy', name: 'PIA Proxy 30 Days', slug: 'pia-30d', description: 'Private Internet Access proxy for 30 days', price: 9.95, currency: 'USD', features: [], duration: '30 days', provider: 'Private Internet Access', imageFilename: 'pia.webp', outOfStock: false, isActive: true, link: '' },

    // Other VPNs with multiple plans
    { category: 'vpn', name: 'TunnelBear 1 Month', slug: 'tunnelbear-1m', description: 'TunnelBear VPN plan for 1 month', price: 9.99, currency: 'USD', features: ['Easy setup'], duration: '1 month', provider: 'TunnelBear', imageFilename: 'tunnel-bear.webp', outOfStock: false, isActive: true, link: '' },
    { category: 'vpn', name: 'Hotspot Shield 1 Month', slug: 'hotspot-shield-1m', description: 'Hotspot Shield VPN for 1 month', price: 12.99, currency: 'USD', features: ['Streaming'], duration: '1 month', provider: 'Hotspot Shield', imageFilename: 'hotspot-shield.webp', outOfStock: false, isActive: true, link: '' },
    { category: 'vpn', name: 'PureVPN 1 Month', slug: 'purevpn-1m', description: 'PureVPN plans for 1 month', price: 10.95, currency: 'USD', features: ['Multiple protocols'], duration: '1 month', provider: 'PureVPN', imageFilename: 'pure-vpn.webp', outOfStock: false, isActive: true, link: '' },
    { category: 'vpn', name: 'HMA VPN 1 Month', slug: 'hma-1m', description: 'HMA VPN plan for 1 month', price: 11.99, currency: 'USD', features: [], duration: '1 month', provider: 'HMA', imageFilename: 'hma.webp', outOfStock: false, isActive: true, link: '' },
    { category: 'vpn', name: 'ESET VPN 1 Month', slug: 'eset-vpn-1m', description: 'ESET VPN plan for 1 month', price: 8.99, currency: 'USD', features: [], duration: '1 month', provider: 'ESET', imageFilename: 'eset-vpn.webp', outOfStock: false, isActive: true, link: '' },
    { category: 'vpn', name: 'Windscribe 1 Month', slug: 'windscribe-1m', description: 'Windscribe VPN for 1 month', price: 9.00, currency: 'USD', features: [], duration: '1 month', provider: 'Windscribe', imageFilename: 'windscribe.webp', outOfStock: false, isActive: true, link: '' },
    { category: 'vpn', name: 'VyprVPN 1 Month', slug: 'vyprvpn-1m', description: 'VyprVPN plan for 1 month', price: 12.95, currency: 'USD', features: [], duration: '1 month', provider: 'VyprVPN', imageFilename: 'vypr-vpn.webp', outOfStock: false, isActive: true, link: '' },
    { category: 'vpn', name: 'IPVanish 1 Month', slug: 'ipvanish-1m', description: 'IPVanish VPN plan for 1 month', price: 11.99, currency: 'USD', features: [], duration: '1 month', provider: 'IPVanish', imageFilename: 'ip-vanish.webp', outOfStock: false, isActive: true, link: '' }
  ];

  try {
    for (const item of samples) {
      const ref = await db.collection('product_listings').add({
        ...item,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log('Created', ref.id, item.name);
    }
    console.log('Done creating sample vpn/proxy products.');
  } catch (err) {
    console.error('Error creating products', err);
  } finally {
    process.exit(0);
  }
}

main();
