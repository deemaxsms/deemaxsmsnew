#!/usr/bin/env node
// Script to create RDP and Gift Card products in `product_listings` collection.
// Usage: node scripts/create_rdp_gift_collection.js

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
    console.log('✅ Initialized admin with service account');
  } else {
    admin.initializeApp();
    console.log('✅ Initialized admin with default credentials');
  }
}

async function main() {
  initAdmin();
  const db = admin.firestore();

  const rdpProducts = [
    // Windows RDP Products
    {
      category: 'rdp',
      name: 'Windows 10 RDP - Basic',
      slug: 'windows-10-rdp-basic',
      description: 'Windows 10 Remote Desktop with 2GB RAM, 1 vCPU, 20GB SSD',
      price: 15.99,
      currency: 'USD',
      features: ['Windows 10 Pro', '2GB RAM', '1 vCPU', '20GB SSD', '24/7 Access', 'Admin Rights'],
      duration: '30 days',
      specifications: {
        os: 'Windows 10 Pro',
        ram: '2GB',
        cpu: '1 vCPU',
        storage: '20GB SSD',
        bandwidth: 'Unlimited'
      },
      provider: 'CloudRDP',
      imageFilename: 'windows-rdp.webp',
      outOfStock: false,
      isActive: true,
      link: '',
      subcategory: 'windows'
    },
    {
      category: 'rdp',
      name: 'Windows 10 RDP - Standard',
      slug: 'windows-10-rdp-standard',
      description: 'Windows 10 Remote Desktop with 4GB RAM, 2 vCPU, 40GB SSD',
      price: 25.99,
      currency: 'USD',
      features: ['Windows 10 Pro', '4GB RAM', '2 vCPU', '40GB SSD', '24/7 Access', 'Admin Rights', 'Pre-installed Software'],
      duration: '30 days',
      specifications: {
        os: 'Windows 10 Pro',
        ram: '4GB',
        cpu: '2 vCPU',
        storage: '40GB SSD',
        bandwidth: 'Unlimited'
      },
      provider: 'CloudRDP',
      imageFilename: 'windows-rdp.webp',
      outOfStock: false,
      isActive: true,
      link: '',
      subcategory: 'windows'
    },
    {
      category: 'rdp',
      name: 'Windows 11 RDP - Premium',
      slug: 'windows-11-rdp-premium',
      description: 'Windows 11 Remote Desktop with 8GB RAM, 4 vCPU, 80GB SSD',
      price: 45.99,
      currency: 'USD',
      features: ['Windows 11 Pro', '8GB RAM', '4 vCPU', '80GB SSD', '24/7 Access', 'Admin Rights', 'Office Suite', 'Gaming Ready'],
      duration: '30 days',
      specifications: {
        os: 'Windows 11 Pro',
        ram: '8GB',
        cpu: '4 vCPU',
        storage: '80GB SSD',
        bandwidth: 'Unlimited'
      },
      provider: 'CloudRDP',
      imageFilename: 'windows-11-rdp.webp',
      outOfStock: false,
      isActive: true,
      link: '',
      subcategory: 'windows'
    },
    {
      category: 'rdp',
      name: 'Windows Server 2019 RDP',
      slug: 'windows-server-2019-rdp',
      description: 'Windows Server 2019 Remote Desktop with 6GB RAM, 3 vCPU, 60GB SSD',
      price: 35.99,
      currency: 'USD',
      features: ['Windows Server 2019', '6GB RAM', '3 vCPU', '60GB SSD', '24/7 Access', 'Admin Rights', 'IIS', 'SQL Server Express'],
      duration: '30 days',
      specifications: {
        os: 'Windows Server 2019',
        ram: '6GB',
        cpu: '3 vCPU',
        storage: '60GB SSD',
        bandwidth: 'Unlimited'
      },
      provider: 'ServerRDP',
      imageFilename: 'windows-server-rdp.webp',
      outOfStock: false,
      isActive: true,
      link: '',
      subcategory: 'server'
    },

    // Linux RDP Products
    {
      category: 'rdp',
      name: 'Ubuntu Desktop RDP',
      slug: 'ubuntu-desktop-rdp',
      description: 'Ubuntu 22.04 Desktop with GUI, 4GB RAM, 2 vCPU, 40GB SSD',
      price: 18.99,
      currency: 'USD',
      features: ['Ubuntu 22.04 LTS', '4GB RAM', '2 vCPU', '40GB SSD', 'GNOME Desktop', 'Development Tools', 'Docker'],
      duration: '30 days',
      specifications: {
        os: 'Ubuntu 22.04 LTS',
        ram: '4GB',
        cpu: '2 vCPU',
        storage: '40GB SSD',
        bandwidth: 'Unlimited'
      },
      provider: 'LinuxRDP',
      imageFilename: 'ubuntu-rdp.webp',
      outOfStock: false,
      isActive: true,
      link: '',
      subcategory: 'linux'
    },
    {
      category: 'rdp',
      name: 'CentOS Desktop RDP',
      slug: 'centos-desktop-rdp',
      description: 'CentOS 8 Desktop with GUI, 3GB RAM, 2 vCPU, 30GB SSD',
      price: 16.99,
      currency: 'USD',
      features: ['CentOS 8', '3GB RAM', '2 vCPU', '30GB SSD', 'XFCE Desktop', 'Development Tools', 'Apache'],
      duration: '30 days',
      specifications: {
        os: 'CentOS 8',
        ram: '3GB',
        cpu: '2 vCPU',
        storage: '30GB SSD',
        bandwidth: 'Unlimited'
      },
      provider: 'LinuxRDP',
      imageFilename: 'centos-rdp.webp',
      outOfStock: false,
      isActive: true,
      link: '',
      subcategory: 'linux'
    }
  ];

  const giftProducts = [
    // Digital Gift Cards
    {
      category: 'gift',
      name: 'Amazon Gift Card - $10',
      slug: 'amazon-gift-card-10',
      description: 'Amazon.com Gift Card - $10 USD Digital Code',
      price: 10.50,
      currency: 'USD',
      features: ['Digital Delivery', 'No Expiration', 'US Amazon Only', 'Instant Delivery'],
      duration: 'No Expiration',
      giftValue: 10,
      giftCurrency: 'USD',
      provider: 'Amazon',
      imageFilename: 'amazon-gift-card.webp',
      outOfStock: false,
      isActive: true,
      link: '',
      subcategory: 'digital',
      deliveryMethod: 'email'
    },
    {
      category: 'gift',
      name: 'Amazon Gift Card - $25',
      slug: 'amazon-gift-card-25',
      description: 'Amazon.com Gift Card - $25 USD Digital Code',
      price: 26.25,
      currency: 'USD',
      features: ['Digital Delivery', 'No Expiration', 'US Amazon Only', 'Instant Delivery'],
      duration: 'No Expiration',
      giftValue: 25,
      giftCurrency: 'USD',
      provider: 'Amazon',
      imageFilename: 'amazon-gift-card.webp',
      outOfStock: false,
      isActive: true,
      link: '',
      subcategory: 'digital',
      deliveryMethod: 'email'
    },
    {
      category: 'gift',
      name: 'Amazon Gift Card - $50',
      slug: 'amazon-gift-card-50',
      description: 'Amazon.com Gift Card - $50 USD Digital Code',
      price: 52.50,
      currency: 'USD',
      features: ['Digital Delivery', 'No Expiration', 'US Amazon Only', 'Instant Delivery'],
      duration: 'No Expiration',
      giftValue: 50,
      giftCurrency: 'USD',
      provider: 'Amazon',
      imageFilename: 'amazon-gift-card.webp',
      outOfStock: false,
      isActive: true,
      link: '',
      subcategory: 'digital',
      deliveryMethod: 'email'
    },
    {
      category: 'gift',
      name: 'Google Play Gift Card - $10',
      slug: 'google-play-gift-card-10',
      description: 'Google Play Store Gift Card - $10 USD Digital Code',
      price: 10.50,
      currency: 'USD',
      features: ['Digital Delivery', 'Apps & Games', 'Movies & Music', 'Instant Delivery'],
      duration: 'No Expiration',
      giftValue: 10,
      giftCurrency: 'USD',
      provider: 'Google',
      imageFilename: 'google-play-gift-card.webp',
      outOfStock: false,
      isActive: true,
      link: '',
      subcategory: 'digital',
      deliveryMethod: 'email'
    },
    {
      category: 'gift',
      name: 'Apple App Store Gift Card - $15',
      slug: 'apple-app-store-gift-card-15',
      description: 'Apple App Store & iTunes Gift Card - $15 USD Digital Code',
      price: 15.75,
      currency: 'USD',
      features: ['Digital Delivery', 'Apps & Games', 'Music & Movies', 'Instant Delivery'],
      duration: 'No Expiration',
      giftValue: 15,
      giftCurrency: 'USD',
      provider: 'Apple',
      imageFilename: 'apple-gift-card.webp',
      outOfStock: false,
      isActive: true,
      link: '',
      subcategory: 'digital',
      deliveryMethod: 'email'
    },
    {
      category: 'gift',
      name: 'Steam Gift Card - $20',
      slug: 'steam-gift-card-20',
      description: 'Steam Wallet Gift Card - $20 USD Digital Code',
      price: 21.00,
      currency: 'USD',
      features: ['Digital Delivery', 'PC Gaming', 'Instant Delivery', 'Global Use'],
      duration: 'No Expiration',
      giftValue: 20,
      giftCurrency: 'USD',
      provider: 'Steam',
      imageFilename: 'steam-gift-card.webp',
      outOfStock: false,
      isActive: true,
      link: '',
      subcategory: 'gaming',
      deliveryMethod: 'email'
    },
    {
      category: 'gift',
      name: 'Netflix Gift Card - $30',
      slug: 'netflix-gift-card-30',
      description: 'Netflix Streaming Gift Card - $30 USD Digital Code',
      price: 31.50,
      currency: 'USD',
      features: ['Digital Delivery', 'Streaming Service', 'US Netflix Only', 'Instant Delivery'],
      duration: 'No Expiration',
      giftValue: 30,
      giftCurrency: 'USD',
      provider: 'Netflix',
      imageFilename: 'netflix-gift-card.webp',
      outOfStock: false,
      isActive: true,
      link: '',
      subcategory: 'entertainment',
      deliveryMethod: 'email'
    },
    {
      category: 'gift',
      name: 'Spotify Premium Gift Card - 3 Months',
      slug: 'spotify-premium-gift-card-3m',
      description: 'Spotify Premium Subscription - 3 Months Gift Code',
      price: 29.99,
      currency: 'USD',
      features: ['Digital Delivery', '3 Months Premium', 'Ad-Free Music', 'Instant Delivery'],
      duration: '3 Months',
      giftValue: 29.99,
      giftCurrency: 'USD',
      provider: 'Spotify',
      imageFilename: 'spotify-gift-card.webp',
      outOfStock: false,
      isActive: true,
      link: '',
      subcategory: 'entertainment',
      deliveryMethod: 'email'
    }
  ];

  try {
    console.log('🚀 Creating RDP products...');
    for (const item of rdpProducts) {
      const ref = await db.collection('product_listings').add({
        ...item,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log('✅ Created RDP:', ref.id, item.name);
    }

    console.log('\n🎁 Creating Gift Card products...');
    for (const item of giftProducts) {
      const ref = await db.collection('product_listings').add({
        ...item,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log('✅ Created Gift Card:', ref.id, item.name);
    }

    console.log('\n🎉 Successfully created all RDP and Gift Card products!');
    console.log(`📊 Total created: ${rdpProducts.length} RDP + ${giftProducts.length} Gift Cards = ${rdpProducts.length + giftProducts.length} products`);
    
  } catch (err) {
    console.error('❌ Error creating products:', err);
  } finally {
    process.exit(0);
  }
}

main();