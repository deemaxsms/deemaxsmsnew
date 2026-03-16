#!/usr/bin/env node
// Script to create real eSIM products in `product_listings` collection.
// Usage: node scripts/create_esim_collection.js

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
    // Airalo eSIM products - Global Data (real plans from Airalo Discover)
    {
      category: 'esim',
      subcategory: 'global-data',
      name: 'Airalo Discover Global eSIM 1GB',
      slug: 'airalo-global-1gb',
      description: '1GB high-speed data for global travel with Airalo eSIM, suitable for light users checking emails and maps.',
      price: 13500, // $9 USD ≈ 13500 NGN
      currency: 'NGN',
      features: ['1GB data', '7 days validity', '130+ countries', 'Instant activation via QR code', 'Data-only (no voice/SMS)', 'Top-up available', 'Compatible with eSIM devices'],
      dataAmount: '1GB',
      validity: '7 days',
      coverage: '130+ countries worldwide',
      provider: 'Airalo',
      image: 'https://miro.medium.com/0*sV47jAXHKP57karv.jpeg', // Real product image
      outOfStock: false,
      isActive: true,
      link: 'https://www.airalo.com/global-esim' // Actual provider link for reference
    },
    {
      category: 'esim',
      subcategory: 'global-data',
      name: 'Airalo Discover Global eSIM 3GB',
      slug: 'airalo-global-3gb',
      description: '3GB high-speed data for global travel with Airalo eSIM, ideal for social media and navigation.',
      price: 36000, // $24 USD ≈ 36000 NGN
      currency: 'NGN',
      features: ['3GB data', '15 days validity', '130+ countries', 'Instant activation via QR code', 'Data-only (no voice/SMS)', 'Top-up available', 'Compatible with eSIM devices'],
      dataAmount: '3GB',
      validity: '15 days',
      coverage: '130+ countries worldwide',
      provider: 'Airalo',
      image: 'https://miro.medium.com/0*sV47jAXHKP57karv.jpeg', // Real product image
      outOfStock: false,
      isActive: true,
      link: 'https://www.airalo.com/global-esim'
    },
    {
      category: 'esim',
      subcategory: 'global-data',
      name: 'Airalo Discover Global eSIM 5GB',
      slug: 'airalo-global-5gb',
      description: '5GB high-speed data for global travel with Airalo eSIM, great for streaming and heavier usage.',
      price: 52500, // $35 USD ≈ 52500 NGN
      currency: 'NGN',
      features: ['5GB data', '30 days validity', '130+ countries', 'Instant activation via QR code', 'Data-only (no voice/SMS)', 'Top-up available', 'Compatible with eSIM devices'],
      dataAmount: '5GB',
      validity: '30 days',
      coverage: '130+ countries worldwide',
      provider: 'Airalo',
      image: 'https://miro.medium.com/0*sV47jAXHKP57karv.jpeg', // Real product image
      outOfStock: false,
      isActive: true,
      link: 'https://www.airalo.com/global-esim'
    },

    // Airalo Regional - Europe (real Eurolink plans)
    {
      category: 'esim',
      subcategory: 'regional-europe',
      name: 'Airalo Eurolink Europe eSIM 1GB',
      slug: 'airalo-europe-1gb',
      description: '1GB data for Europe travel with Airalo eSIM, perfect for short trips and basic connectivity.',
      price: 7650, // 4.50 EUR ≈ 7650 NGN
      currency: 'NGN',
      features: ['1GB data', '7 days validity', '42 European countries', 'Instant activation via app/QR', 'Data-only (no voice/SMS)', 'Top-up available', '24/7 support'],
      dataAmount: '1GB',
      validity: '7 days',
      coverage: '42 European countries',
      provider: 'Airalo',
      image: 'https://www.remitfinder.com/assets/images/providers/content/airalo-esim-network-speed-and-reliability.jpg', // Real product image
      outOfStock: false,
      isActive: true,
      link: 'https://www.airalo.com/europe-esim'
    },
    {
      category: 'esim',
      subcategory: 'regional-europe',
      name: 'Airalo Eurolink Europe eSIM 3GB',
      slug: 'airalo-europe-3gb',
      description: '3GB data for Europe travel with Airalo eSIM, suitable for moderate usage like browsing and apps.',
      price: 19550, // 11.50 EUR ≈ 19550 NGN
      currency: 'NGN',
      features: ['3GB data', '30 days validity', '42 European countries', 'Instant activation via app/QR', 'Data-only (no voice/SMS)', 'Top-up available', '24/7 support'],
      dataAmount: '3GB',
      validity: '30 days',
      coverage: '42 European countries',
      provider: 'Airalo',
      image: 'https://www.remitfinder.com/assets/images/providers/content/airalo-esim-network-speed-and-reliability.jpg', // Real product image
      outOfStock: false,
      isActive: true,
      link: 'https://www.airalo.com/europe-esim'
    },

    // Holafly eSIM products - Regional America (real unlimited plans)
    {
      category: 'esim',
      subcategory: 'regional-america',
      name: 'Holafly USA eSIM Unlimited',
      slug: 'holafly-usa-unlimited',
      description: 'Unlimited data for USA travel with Holafly eSIM, ideal for heavy users with no data worries.',
      price: 96000, // $64 USD for 30 days ≈ 96000 NGN
      currency: 'NGN',
      features: ['Unlimited data (fair usage policy)', '30 days validity', '4G/5G speeds', 'Instant activation via QR/email', 'Data sharing up to 500MB/day', 'Data-only (use apps for calls/SMS)', '24/7 support', 'Compatible with eSIM devices'],
      dataAmount: 'Unlimited',
      validity: '30 days',
      coverage: 'USA (excellent in urban areas)',
      provider: 'Holafly',
      image: 'https://i0.wp.com/passporterapp.com/en/blog/wp-content/uploads/2023/03/Holafly-Review.jpg?fit=1721%2C1151&ssl=1', // Real product image
      outOfStock: false,
      isActive: true,
      link: 'https://esim.holafly.com/esim-united-states/'
    },
    {
      category: 'esim',
      subcategory: 'regional-america',
      name: 'Holafly Canada eSIM Unlimited',
      slug: 'holafly-canada-unlimited',
      description: 'Unlimited data for Canada travel with Holafly eSIM, perfect for streaming and navigation.',
      price: 85500, // $57 USD for 30 days ≈ 85500 NGN (based on similar pricing)
      currency: 'NGN',
      features: ['Unlimited data (fair usage policy)', '30 days validity', '4G/5G speeds', 'Instant activation via QR/email', 'Data sharing up to 500MB/day', 'Data-only (use apps for calls/SMS)', '24/7 support', 'Compatible with eSIM devices'],
      dataAmount: 'Unlimited',
      validity: '30 days',
      coverage: 'Canada (excellent in urban areas)',
      provider: 'Holafly',
      image: 'https://i0.wp.com/awaywiththesteiners.com/wp-content/uploads/2024/06/Holafly-esim-discount-code-1024x523-1.jpg?fit=1600%2C1066&ssl=1', // Real product image
      outOfStock: false,
      isActive: true,
      link: 'https://esim.holafly.com/esim-canada/'
    },

    // Nomad eSIM - Asia (real plans)
    {
      category: 'esim',
      subcategory: 'regional-asia',
      name: 'Nomad Japan eSIM 3GB',
      slug: 'nomad-japan-3gb',
      description: '3GB data for Japan travel with Nomad eSIM, great for city exploration and apps.',
      price: 12000, // $8 USD ≈ 12000 NGN
      currency: 'NGN',
      features: ['3GB data', '30 days validity', 'High-speed 4G/5G', 'Instant activation via QR', 'Data-only (no voice/SMS)', 'Hotspot supported', 'Add-ons available', 'Compatible with eSIM devices'],
      dataAmount: '3GB',
      validity: '30 days',
      coverage: 'Japan (major cities and remote areas)',
      provider: 'Nomad',
      image: 'https://cdn.sanity.io/images/whc4dqyy/production/ccd97ba79aee8755b6ea42f16c63c1ef15bb0721-1280x853.jpg/nomad_esim.jpg', // Real product image
      outOfStock: false,
      isActive: true,
      link: 'https://www.getnomad.app/japan-esim'
    },
    {
      category: 'esim',
      subcategory: 'regional-asia',
      name: 'Nomad Thailand eSIM 10GB',
      slug: 'nomad-thailand-10gb',
      description: '10GB data for Thailand travel with Nomad eSIM, ideal for longer stays and media.',
      price: 18000, // $12 USD ≈ 18000 NGN
      currency: 'NGN',
      features: ['10GB data', '30 days validity', 'High-speed 4G/5G', 'Instant activation via QR', 'Data-only (no voice/SMS)', 'Hotspot supported', 'Add-ons available', 'Compatible with eSIM devices'],
      dataAmount: '10GB',
      validity: '30 days',
      coverage: 'Thailand (major cities, excludes some southern areas)',
      provider: 'Nomad',
      image: 'https://cdn.prod.website-files.com/64b6780f84d27e4bfd91f2d6/6770c0fbcac87d76d5277851_best-esims-thailand.webp', // Real product image
      outOfStock: false,
      isActive: true,
      link: 'https://www.getnomad.app/thailand-esim'
    },

    // Voice eSIM plans (using real Airalo Change+ with voice; Holafly is data-only)
    {
      category: 'esim',
      subcategory: 'voice',
      name: 'Airalo Change+ USA eSIM 3GB',
      slug: 'airalo-voice-usa',
      description: '3GB data with voice and SMS for USA travel with Airalo eSIM.',
      price: 24650, // 14.50 EUR ≈ 24650 NGN
      currency: 'NGN',
      features: ['3GB data', '60 minutes calls', '30 SMS', '30 days validity', 'Instant activation', 'T-Mobile network', 'Top-up available'],
      dataAmount: '3GB',
      validity: '30 days',
      coverage: 'USA',
      provider: 'Airalo',
      image: 'https://i0.wp.com/passporterapp.com/en/blog/wp-content/uploads/2023/03/Holafly-Review.jpg?fit=1721%2C1151&ssl=1', // Related image (USA-focused)
      outOfStock: false,
      isActive: true,
      link: 'https://www.airalo.com/united-states-esim'
    },
    {
      category: 'esim',
      subcategory: 'voice',
      name: 'Holafly Europe eSIM Unlimited',
      slug: 'holafly-europe-unlimited',
      description: 'Unlimited data for Europe travel with Holafly eSIM (data-only; use apps for voice).',
      price: 96000, // $64 USD for 30 days ≈ 96000 NGN
      currency: 'NGN',
      features: ['Unlimited data (fair usage)', '30 days validity', '4G/5G speeds', 'Instant activation via QR/email', 'Data sharing up to 1GB/day', 'Data-only (use WhatsApp for calls/SMS)', '24/7 support'],
      dataAmount: 'Unlimited',
      validity: '30 days',
      coverage: '33 European countries',
      provider: 'Holafly',
      image: 'https://thesavvybackpacker.com/wp-content/uploads/2022/10/holafly-esim-review.jpg', // Real product image
      outOfStock: false,
      isActive: true,
      link: 'https://esim.holafly.com/esim-europe/'
    }
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
    console.log('Done creating real eSIM products.');
  } catch (err) {
    console.error('Error creating products', err);
  } finally {
    process.exit(0);
  }
}

main();