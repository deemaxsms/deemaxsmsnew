#!/usr/bin/env node
// Script to create RDP products in `product_listings` collection.
// This removes old gift cards and focuses only on RDP products
// Usage: node scripts/create_rdp_collection.js

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

async function removeOldGiftCards(db) {
  console.log('🗑️  Removing old gift card products...');
  
  try {
    // Query for gift card products
    const giftCardsQuery = await db.collection('product_listings')
      .where('category', '==', 'gift')
      .get();
    
    if (giftCardsQuery.empty) {
      console.log('ℹ️  No gift card products found to remove');
      return;
    }
    
    // Delete each gift card product
    const batch = db.batch();
    giftCardsQuery.docs.forEach(doc => {
      console.log(`🗑️  Queuing for deletion: ${doc.data().name}`);
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log(`✅ Removed ${giftCardsQuery.docs.length} old gift card products`);
    
  } catch (error) {
    console.error('❌ Error removing gift cards:', error);
  }
}

async function main() {
  initAdmin();
  const db = admin.firestore();

  // Remove old gift cards first
  await removeOldGiftCards(db);

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
    {
      category: 'rdp',
      name: 'Windows Server 2022 RDP',
      slug: 'windows-server-2022-rdp',
      description: 'Windows Server 2022 Remote Desktop with 8GB RAM, 4 vCPU, 80GB SSD',
      price: 49.99,
      currency: 'USD',
      features: ['Windows Server 2022', '8GB RAM', '4 vCPU', '80GB SSD', '24/7 Access', 'Admin Rights', 'IIS', 'SQL Server', 'Hyper-V'],
      duration: '30 days',
      specifications: {
        os: 'Windows Server 2022',
        ram: '8GB',
        cpu: '4 vCPU',
        storage: '80GB SSD',
        bandwidth: 'Unlimited'
      },
      provider: 'ServerRDP',
      imageFilename: 'windows-server-2022-rdp.webp',
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
    },
    {
      category: 'rdp',
      name: 'Debian Desktop RDP',
      slug: 'debian-desktop-rdp',
      description: 'Debian 11 Desktop with GUI, 3GB RAM, 2 vCPU, 35GB SSD',
      price: 17.99,
      currency: 'USD',
      features: ['Debian 11', '3GB RAM', '2 vCPU', '35GB SSD', 'XFCE Desktop', 'Development Tools', 'LAMP Stack'],
      duration: '30 days',
      specifications: {
        os: 'Debian 11',
        ram: '3GB',
        cpu: '2 vCPU',
        storage: '35GB SSD',
        bandwidth: 'Unlimited'
      },
      provider: 'LinuxRDP',
      imageFilename: 'debian-rdp.webp',
      outOfStock: false,
      isActive: true,
      link: '',
      subcategory: 'linux'
    },
    // Specialized RDP Products
    {
      category: 'rdp',
      name: 'Trading RDP - High Performance',
      slug: 'trading-rdp-high-performance',
      description: 'High-performance RDP optimized for trading with low latency',
      price: 89.99,
      currency: 'USD',
      features: ['Windows 11 Pro', '16GB RAM', '8 vCPU', '120GB NVMe SSD', 'Low Latency', 'Trading Software', 'Multiple Monitors'],
      duration: '30 days',
      specifications: {
        os: 'Windows 11 Pro',
        ram: '16GB',
        cpu: '8 vCPU',
        storage: '120GB NVMe SSD',
        bandwidth: 'Unlimited',
        latency: 'Ultra Low'
      },
      provider: 'TradingRDP',
      imageFilename: 'trading-rdp.webp',
      outOfStock: false,
      isActive: true,
      link: '',
      subcategory: 'specialized'
    },
    {
      category: 'rdp',
      name: 'Gaming RDP - Ultimate',
      slug: 'gaming-rdp-ultimate',
      description: 'Ultimate gaming RDP with GPU acceleration and high-end specs',
      price: 129.99,
      currency: 'USD',
      features: ['Windows 11 Pro', '32GB RAM', '12 vCPU', '200GB NVMe SSD', 'GPU Acceleration', 'Steam Pre-installed', 'Gaming Optimized'],
      duration: '30 days',
      specifications: {
        os: 'Windows 11 Pro',
        ram: '32GB',
        cpu: '12 vCPU',
        storage: '200GB NVMe SSD',
        bandwidth: 'Unlimited',
        gpu: 'Dedicated GPU'
      },
      provider: 'GamingRDP',
      imageFilename: 'gaming-rdp.webp',
      outOfStock: false,
      isActive: true,
      link: '',
      subcategory: 'specialized'
    }
  ];

  try {
    console.log('\n💻 Creating RDP products...');
    for (const item of rdpProducts) {
      const ref = await db.collection('product_listings').add({
        ...item,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log('✅ Created RDP:', ref.id, item.name);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 RDP COLLECTION SETUP COMPLETE!');
    console.log('='.repeat(60));
    console.log(`📊 Total RDP products created: ${rdpProducts.length}`);
    console.log('💻 Categories included:');
    console.log('   • Windows RDP (Basic to Premium)');
    console.log('   • Windows Server RDP');
    console.log('   • Linux Desktop RDP');
    console.log('   • Specialized RDP (Trading, Gaming)');
    console.log('\n📋 NOTES:');
    console.log('• Old gift card products have been removed');
    console.log('• Physical gifts now use the new Gift Delivery System');
    console.log('• RDP products remain in product_listings for digital delivery');
    console.log('\n🚀 Ready to use!');

  } catch (err) {
    console.error('❌ Error creating RDP products:', err);
  } finally {
    process.exit(0);
  }
}

main();