#!/usr/bin/env node
// Script to set up the complete gift delivery database structure
// Usage: node scripts/setup_gift_delivery_database.js

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

async function setupGiftCategories(db) {
  console.log('\n📂 Setting up gift categories...');
  
  const categories = [
    {
      name: "Birthday Gifts",
      slug: "birthday-gifts",
      description: "Perfect gifts for birthday celebrations",
      icon: "🎂",
      isActive: true,
      sortOrder: 1
    },
    {
      name: "Anniversary Gifts",
      slug: "anniversary-gifts", 
      description: "Romantic gifts for anniversaries",
      icon: "💕",
      isActive: true,
      sortOrder: 2
    },
    {
      name: "Flowers & Bouquets",
      slug: "flowers-bouquets",
      description: "Beautiful fresh flowers and arrangements",
      icon: "🌹",
      isActive: true,
      sortOrder: 3
    },
    {
      name: "Chocolates & Sweets",
      slug: "chocolates-sweets",
      description: "Delicious chocolates and sweet treats",
      icon: "🍫",
      isActive: true,
      sortOrder: 4
    },
    {
      name: "Jewelry & Accessories",
      slug: "jewelry-accessories",
      description: "Elegant jewelry and fashion accessories",
      icon: "💎",
      isActive: true,
      sortOrder: 5
    },
    {
      name: "Custom Gifts",
      slug: "custom-gifts",
      description: "Personalized and custom-made gifts",
      icon: "🎨",
      isActive: true,
      sortOrder: 6
    }
  ];

  for (const category of categories) {
    const ref = await db.collection('gift_categories').add({
      ...category,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log(`✅ Created category: ${category.name} (${ref.id})`);
  }
}

async function setupSampleGifts(db) {
  console.log('\n🎁 Setting up sample gifts...');
  
  // Get category IDs first
  const categoriesSnapshot = await db.collection('gift_categories').get();
  const categories = {};
  categoriesSnapshot.forEach(doc => {
    const data = doc.data();
    categories[data.slug] = doc.id;
  });

  const gifts = [
    {
      title: "Red Rose Bouquet",
      slug: "red-rose-bouquet",
      description: "Beautiful arrangement of 12 fresh red roses with elegant wrapping",
      categoryId: categories['flowers-bouquets'],
      images: [
        "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=400",
        "https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=400"
      ],
      basePrice: 45.00,
      currency: "USD",
      weight: 0.5,
      dimensions: { length: 30, width: 20, height: 40 },
      sizeClass: "medium",
      isFragile: true,
      handlingTimeDays: 1,
      tags: ["roses", "romantic", "flowers", "red"],
      isActive: true
    },
    {
      title: "Premium Chocolate Box",
      slug: "premium-chocolate-box",
      description: "Luxury assorted chocolates in elegant gift box",
      categoryId: categories['chocolates-sweets'],
      images: [
        "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=400",
        "https://images.unsplash.com/photo-1511381939415-e44015466834?w=400"
      ],
      basePrice: 35.00,
      currency: "USD",
      weight: 0.8,
      dimensions: { length: 25, width: 25, height: 8 },
      sizeClass: "small",
      isFragile: false,
      handlingTimeDays: 1,
      tags: ["chocolate", "luxury", "sweet", "gift-box"],
      isActive: true
    },
    {
      title: "Silver Heart Necklace",
      slug: "silver-heart-necklace",
      description: "Elegant sterling silver heart pendant necklace",
      categoryId: categories['jewelry-accessories'],
      images: [
        "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400",
        "https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=400"
      ],
      basePrice: 85.00,
      currency: "USD",
      weight: 0.1,
      dimensions: { length: 10, width: 10, height: 2 },
      sizeClass: "small",
      isFragile: true,
      handlingTimeDays: 2,
      tags: ["jewelry", "necklace", "silver", "heart", "romantic"],
      isActive: true
    },
    {
      title: "Birthday Celebration Cake",
      slug: "birthday-celebration-cake",
      description: "Custom decorated birthday cake with personalized message",
      categoryId: categories['birthday-gifts'],
      images: [
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
        "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=400"
      ],
      basePrice: 55.00,
      currency: "USD",
      weight: 2.0,
      dimensions: { length: 30, width: 30, height: 15 },
      sizeClass: "large",
      isFragile: true,
      handlingTimeDays: 2,
      tags: ["cake", "birthday", "celebration", "custom"],
      isActive: true
    },
    {
      title: "Romantic Dinner Package",
      slug: "romantic-dinner-package",
      description: "Complete romantic dinner setup with candles, flowers, and gourmet meal",
      categoryId: categories['anniversary-gifts'],
      images: [
        "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400",
        "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400"
      ],
      basePrice: 120.00,
      currency: "USD",
      weight: 3.0,
      dimensions: { length: 50, width: 40, height: 30 },
      sizeClass: "large",
      isFragile: true,
      handlingTimeDays: 3,
      tags: ["romantic", "dinner", "anniversary", "candles", "premium"],
      isActive: true
    }
  ];

  for (const gift of gifts) {
    const ref = await db.collection('gifts').add({
      ...gift,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log(`✅ Created gift: ${gift.title} (${ref.id})`);
  }
}

async function setupShippingRates(db) {
  console.log('\n🚚 Setting up shipping rates...');
  
  const rates = [
    // Nigeria (domestic)
    { fromCountry: "NG", toCountry: "NG", baseFee: 5.00, ratePerKg: 2.00, ratePerKm: 0.01, internationalMultiplier: 1.0, fragileMultiplier: 1.2 },
    
    // West Africa
    { fromCountry: "NG", toCountry: "GH", baseFee: 15.00, ratePerKg: 5.00, ratePerKm: 0.02, internationalMultiplier: 1.3, fragileMultiplier: 1.3 },
    { fromCountry: "NG", toCountry: "BF", baseFee: 18.00, ratePerKg: 6.00, ratePerKm: 0.02, internationalMultiplier: 1.4, fragileMultiplier: 1.3 },
    
    // North America
    { fromCountry: "NG", toCountry: "US", baseFee: 35.00, ratePerKg: 12.00, ratePerKm: 0.03, internationalMultiplier: 2.0, fragileMultiplier: 1.5 },
    { fromCountry: "NG", toCountry: "CA", baseFee: 38.00, ratePerKg: 13.00, ratePerKm: 0.03, internationalMultiplier: 2.1, fragileMultiplier: 1.5 },
    
    // Europe
    { fromCountry: "NG", toCountry: "GB", baseFee: 32.00, ratePerKg: 11.00, ratePerKm: 0.025, internationalMultiplier: 1.8, fragileMultiplier: 1.4 },
    { fromCountry: "NG", toCountry: "DE", baseFee: 30.00, ratePerKg: 10.00, ratePerKm: 0.025, internationalMultiplier: 1.7, fragileMultiplier: 1.4 },
    { fromCountry: "NG", toCountry: "FR", baseFee: 31.00, ratePerKg: 10.50, ratePerKm: 0.025, internationalMultiplier: 1.75, fragileMultiplier: 1.4 },
    
    // Asia
    { fromCountry: "NG", toCountry: "CN", baseFee: 28.00, ratePerKg: 9.00, ratePerKm: 0.02, internationalMultiplier: 1.6, fragileMultiplier: 1.3 },
    { fromCountry: "NG", toCountry: "IN", baseFee: 25.00, ratePerKg: 8.00, ratePerKm: 0.02, internationalMultiplier: 1.5, fragileMultiplier: 1.3 },
    { fromCountry: "NG", toCountry: "JP", baseFee: 40.00, ratePerKg: 14.00, ratePerKm: 0.03, internationalMultiplier: 2.2, fragileMultiplier: 1.6 }
  ];

  for (const rate of rates) {
    const ref = await db.collection('shipping_rates').add({
      ...rate,
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log(`✅ Created shipping rate: ${rate.fromCountry} → ${rate.toCountry} ($${rate.baseFee})`);
  }
}

async function setupSizeFees(db) {
  console.log('\n📦 Setting up size fees...');
  
  const sizeFees = [
    { sizeClass: "small", baseFee: 0.00, description: "Small packages (up to 30cm)" },
    { sizeClass: "medium", baseFee: 5.00, description: "Medium packages (30-60cm)" },
    { sizeClass: "large", baseFee: 12.00, description: "Large packages (60cm+)" }
  ];

  for (const sizeFee of sizeFees) {
    const ref = await db.collection('shipping_size_fees').add({
      ...sizeFee,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log(`✅ Created size fee: ${sizeFee.sizeClass} (+$${sizeFee.baseFee})`);
  }
}

async function setupGiftAvailability(db) {
  console.log('\n🌍 Setting up gift availability by country...');
  
  // Get all gifts
  const giftsSnapshot = await db.collection('gifts').get();
  const giftIds = giftsSnapshot.docs.map(doc => doc.id);
  
  // Countries where gifts are available
  const availableCountries = [
    { code: "NG", name: "Nigeria", deliveryDays: 1 },
    { code: "GH", name: "Ghana", deliveryDays: 3 },
    { code: "US", name: "United States", deliveryDays: 7 },
    { code: "GB", name: "United Kingdom", deliveryDays: 5 },
    { code: "CA", name: "Canada", deliveryDays: 8 },
    { code: "DE", name: "Germany", deliveryDays: 6 },
    { code: "FR", name: "France", deliveryDays: 6 },
    { code: "CN", name: "China", deliveryDays: 10 },
    { code: "IN", name: "India", deliveryDays: 8 },
    { code: "JP", name: "Japan", deliveryDays: 9 }
  ];

  for (const giftId of giftIds) {
    for (const country of availableCountries) {
      const ref = await db.collection('gift_availability').add({
        giftId,
        countryCode: country.code,
        countryName: country.name,
        isAvailable: true,
        estimatedDeliveryDays: country.deliveryDays,
        additionalFee: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  }
  
  console.log(`✅ Created availability records for ${giftIds.length} gifts across ${availableCountries.length} countries`);
}

async function main() {
  initAdmin();
  const db = admin.firestore();
  
  console.log('🎁 Setting up Gift Delivery Database...\n');
  
  try {
    // Setup all collections
    await setupGiftCategories(db);
    await setupSampleGifts(db);
    await setupShippingRates(db);
    await setupSizeFees(db);
    await setupGiftAvailability(db);
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 GIFT DELIVERY DATABASE SETUP COMPLETE!');
    console.log('='.repeat(50));
    console.log('✅ Gift categories created');
    console.log('✅ Sample gifts added');
    console.log('✅ Shipping rates configured');
    console.log('✅ Size fees set up');
    console.log('✅ Gift availability configured');
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Deploy the updated Firestore rules');
    console.log('2. Build the gift selection UI');
    console.log('3. Implement address collection system');
    console.log('4. Set up shipping calculator');
    console.log('5. Create order tracking system');
    console.log('\n🚀 Your gift delivery platform is ready!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  } finally {
    process.exit(0);
  }
}

main();