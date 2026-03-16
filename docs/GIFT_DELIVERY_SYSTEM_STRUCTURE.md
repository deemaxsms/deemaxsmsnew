# Gift Delivery System - Complete Structure

## 🎁 SYSTEM OVERVIEW
**Real Physical Gift Delivery Platform**
- Users send real gifts (flowers, items, etc.) to anyone worldwide
- Precise address collection with map confirmation
- Saved addresses for repeat deliveries
- Custom gift requests with admin approval
- Dynamic shipping fees based on location/weight
- Shareable tracking links for recipients

---

## 📊 DATABASE COLLECTIONS & FIELDS

### 1. **users** Collection
```javascript
{
  id: "user_123",
  email: "sender@email.com",
  displayName: "John Doe",
  phoneNumber: "+1234567890",
  countryCode: "US",
  preferredCurrency: "USD",
  balance: 150.00,
  isAdmin: false,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 2. **gift_categories** Collection
```javascript
{
  id: "cat_123",
  name: "Birthday Gifts",
  slug: "birthday-gifts",
  description: "Perfect gifts for birthdays",
  icon: "🎂",
  isActive: true,
  sortOrder: 1,
  createdAt: timestamp
}
```

### 3. **gifts** Collection (Your Catalog)
```javascript
{
  id: "gift_123",
  title: "Red Rose Bouquet",
  slug: "red-rose-bouquet",
  description: "Beautiful red roses arranged perfectly",
  categoryId: "cat_123",
  images: [
    "https://storage.com/gift1.jpg",
    "https://storage.com/gift2.jpg"
  ],
  basePrice: 45.00,
  currency: "USD",
  weight: 0.5, // kg
  dimensions: {
    length: 30, // cm
    width: 20,
    height: 40
  },
  sizeClass: "medium", // small, medium, large
  isFragile: true,
  handlingTimeDays: 2,
  tags: ["roses", "romantic", "flowers"],
  isActive: true,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 4. **gift_availability** Collection
```javascript
{
  id: "avail_123",
  giftId: "gift_123",
  countryCode: "NG",
  countryName: "Nigeria",
  isAvailable: true,
  estimatedDeliveryDays: 3,
  additionalFee: 0, // Extra fee for this country
  createdAt: timestamp
}
```

### 5. **saved_addresses** Collection
```javascript
{
  id: "addr_123",
  userId: "user_123",
  label: "Mom's House", // User-friendly name
  recipientName: "Jane Doe",
  recipientPhone: "+2348012345678",
  recipientEmail: "jane@email.com", // optional
  
  // Structured Address
  countryCode: "NG",
  countryName: "Nigeria",
  state: "Lagos",
  city: "Lagos",
  streetName: "Victoria Island Road",
  houseNumber: "123",
  apartment: "Apt 4B", // optional
  landmark: "Near First Bank", // very important
  postalCode: "101241", // optional
  
  // Precise Location
  latitude: 6.4281,
  longitude: 3.4219,
  mapPlaceId: "ChIJ...", // from geocoding API
  addressLine: "123 Victoria Island Road, Apt 4B, Near First Bank",
  
  // Metadata
  isDefault: false,
  isVerified: true, // confirmed on map
  timesUsed: 3,
  lastUsedAt: timestamp,
  createdAt: timestamp
}
```

### 6. **custom_gift_requests** Collection
```javascript
{
  id: "req_123",
  userId: "user_123",
  title: "Custom Chocolate Cake",
  description: "3-layer chocolate cake with vanilla frosting",
  budgetMin: 50.00,
  budgetMax: 100.00,
  preferredBrand: "Local Bakery",
  preferredSpecs: "Heart-shaped, red roses decoration",
  urgencyLevel: "normal", // normal, urgent
  targetDeliveryDate: "2025-12-25",
  
  // Delivery Info
  deliveryCountry: "NG",
  deliveryCity: "Lagos",
  addressId: "addr_123", // reference to saved address
  
  // Reference Images
  referenceImages: [
    "https://storage.com/ref1.jpg"
  ],
  
  // Status & Admin Response
  status: "pending", // pending, approved, rejected, priced, completed
  adminNotes: "Beautiful request, we can fulfill this",
  adminResponse: {
    finalPrice: 75.00,
    shippingFee: 15.00,
    estimatedDeliveryDays: 5,
    productImages: ["https://storage.com/final1.jpg"],
    adminMessage: "We'll create exactly what you requested"
  },
  
  createdAt: timestamp,
  updatedAt: timestamp,
  reviewedAt: timestamp
}
```

### 7. **gift_orders** Collection
```javascript
{
  id: "order_123",
  orderNumber: "GFT-2025-001234", // Human-readable
  
  // Participants
  senderId: "user_123",
  senderName: "John Doe",
  senderEmail: "john@email.com",
  senderPhone: "+1234567890",
  senderMessage: "Happy Birthday! Love you ❤️",
  showSenderName: true, // or anonymous
  
  // Gift Details
  giftId: "gift_123", // null if custom request
  customRequestId: null, // null if regular gift
  giftTitle: "Red Rose Bouquet",
  giftImages: ["https://storage.com/gift1.jpg"],
  quantity: 1,
  
  // Pricing
  giftPrice: 45.00,
  shippingFee: 20.00,
  totalAmount: 65.00,
  currency: "USD",
  
  // Delivery Details
  addressId: "addr_123",
  recipientName: "Jane Doe",
  recipientPhone: "+2348012345678",
  recipientEmail: "jane@email.com",
  deliveryAddress: {
    // Copy of address at time of order
    countryCode: "NG",
    state: "Lagos",
    city: "Lagos",
    streetName: "Victoria Island Road",
    houseNumber: "123",
    apartment: "Apt 4B",
    landmark: "Near First Bank",
    latitude: 6.4281,
    longitude: 3.4219,
    addressLine: "123 Victoria Island Road, Apt 4B, Near First Bank, Lagos, Nigeria"
  },
  
  // Delivery Instructions
  deliveryInstructions: "Call before delivery, gate code is 1234",
  preferredDeliveryTime: "morning", // morning, afternoon, evening, anytime
  targetDeliveryDate: "2025-12-25",
  estimatedDeliveryDate: "2025-12-25",
  actualDeliveryDate: null,
  
  // Status Tracking
  status: "confirmed", // pending_payment, confirmed, processing, shipped, out_for_delivery, delivered, cancelled
  trackingNumber: "TRK123456789",
  courierName: "DHL",
  courierTrackingUrl: "https://dhl.com/track/TRK123456789",
  
  // Payment
  paymentStatus: "completed", // pending, completed, failed, refunded
  paymentMethod: "balance",
  transactionId: "txn_123",
  
  // Timestamps
  createdAt: timestamp,
  confirmedAt: timestamp,
  shippedAt: timestamp,
  deliveredAt: timestamp,
  updatedAt: timestamp
}
```

### 8. **order_status_history** Collection
```javascript
{
  id: "status_123",
  orderId: "order_123",
  status: "shipped",
  message: "Your gift has been shipped via DHL",
  location: "Lagos, Nigeria",
  updatedBy: "admin_456", // or "system"
  isVisibleToRecipient: true,
  createdAt: timestamp
}
```

### 9. **shipping_rates** Collection
```javascript
{
  id: "rate_123",
  fromCountry: "NG", // Your base country
  toCountry: "US",
  baseFee: 25.00,
  ratePerKg: 10.00,
  ratePerKm: 0.02,
  internationalMultiplier: 1.5,
  fragileMultiplier: 1.3,
  isActive: true,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 10. **shipping_size_fees** Collection
```javascript
{
  id: "size_123",
  sizeClass: "medium",
  baseFee: 5.00,
  description: "Medium packages (30-60cm)",
  createdAt: timestamp
}
```

### 11. **tracking_links** Collection
```javascript
{
  id: "track_123",
  orderId: "order_123",
  trackingCode: "GFT-TRK-ABC123", // Public tracking code
  recipientName: "Jane Doe",
  giftTitle: "A Special Gift 🎁", // or actual gift name
  estimatedDelivery: "2025-12-25",
  isActive: true,
  viewCount: 5,
  lastViewedAt: timestamp,
  createdAt: timestamp
}
```

---

## 🗺️ ADDRESS & LOCATION SYSTEM

### Address Collection Flow
1. **Country Selection** → Use your `countries.json`
2. **State Selection** → Use CountriesNow API
3. **City Selection** → Use CountriesNow API  
4. **Street Address Input** → User types manually
5. **Map Confirmation** → Show pin, user confirms
6. **Save Address** → Store with label for reuse

### APIs Integration
```javascript
// 1. Countries/States/Cities
const COUNTRIES_API = 'https://countriesnow.space/api/v0.1/countries';

// 2. Geocoding (Address → Coordinates)
const NOMINATIM_API = 'https://nominatim.openstreetmap.org/search';

// 3. Reverse Geocoding (Coordinates → Address)
const REVERSE_API = 'https://nominatim.openstreetmap.org/reverse';

// 4. Map Display
// Use Leaflet.js with OpenStreetMap tiles (free)
```

### Address Validation Process
```javascript
async function validateAddress(addressData) {
  // 1. Geocode the address
  const coords = await geocodeAddress(addressData);
  
  // 2. Reverse geocode to verify
  const verifiedAddress = await reverseGeocode(coords.lat, coords.lng);
  
  // 3. Show map with pin
  showMapConfirmation(coords.lat, coords.lng);
  
  // 4. User confirms: "Yes, this is correct"
  // 5. Save with coordinates
}
```

---

## 💰 SHIPPING FEE CALCULATION

### Dynamic Calculation Formula
```javascript
function calculateShippingFee(gift, address, rates) {
  const countryRate = rates.find(r => 
    r.fromCountry === 'NG' && r.toCountry === address.countryCode
  );
  
  // Base components
  const baseFee = countryRate.baseFee;
  const weightFee = gift.weight * countryRate.ratePerKg;
  const sizeFee = getSizeFee(gift.sizeClass);
  
  // Distance component (optional)
  const distance = calculateDistance(
    warehouseCoords.lat, warehouseCoords.lng,
    address.latitude, address.longitude
  );
  const distanceFee = distance * countryRate.ratePerKm;
  
  // Multipliers
  const fragileMultiplier = gift.isFragile ? countryRate.fragileMultiplier : 1;
  const internationalMultiplier = address.countryCode !== 'NG' ? 
    countryRate.internationalMultiplier : 1;
  
  // Final calculation
  const subtotal = baseFee + weightFee + sizeFee + distanceFee;
  const total = subtotal * fragileMultiplier * internationalMultiplier;
  
  return Math.round(total * 100) / 100; // Round to 2 decimals
}
```

---

## 🔗 TRACKING SYSTEM

### Shareable Link Structure
```
https://yourdomain.com/track/GFT-TRK-ABC123
```

### Recipient View (No Login Required)
```javascript
// What recipient sees
{
  recipientName: "Jane Doe",
  giftTitle: "A Special Gift 🎁", // or actual name
  senderName: "John Doe", // if not anonymous
  senderMessage: "Happy Birthday! Love you ❤️",
  estimatedDelivery: "December 25, 2025",
  status: "Out for Delivery",
  trackingHistory: [
    { status: "Order Confirmed", date: "Dec 20", location: "Lagos" },
    { status: "Processing", date: "Dec 21", location: "Lagos" },
    { status: "Shipped", date: "Dec 22", location: "Lagos" },
    { status: "Out for Delivery", date: "Dec 25", location: "Your City" }
  ],
  deliveryAddress: "Lagos, Nigeria", // City level only
  courierInfo: {
    name: "DHL",
    trackingUrl: "https://dhl.com/track/TRK123456789"
  }
}
```

---

## 🛠️ ADMIN WORKFLOW

### Custom Gift Request Review
1. **New Request Notification**
2. **Admin Reviews Details**
3. **Admin Decision:**
   - ✅ **Approve** → Set price, upload images, set delivery time
   - ❌ **Reject** → Add reason, notify user
4. **User Notification** → Email/SMS with decision
5. **If Approved** → User pays, order created
6. **Order Processing** → Same as regular gifts

### Order Management
- View all orders by status
- Update order status with messages
- Edit shipping fees (with user notification)
- Upload delivery photos
- Handle customer support

---

## 📱 USER INTERFACE FLOW

### 1. Gift Selection
```
Browse Gifts → Select Gift → Choose Quantity → Next
```

### 2. Recipient Details
```
Select Saved Address OR Add New Address:
├── Country (dropdown from countries.json)
├── State (API call)
├── City (API call)  
├── Street Address (manual input)
├── Map Confirmation (show pin, user confirms)
└── Save Address (with label)
```

### 3. Sender Details & Message
```
├── Sender Name (prefilled from profile)
├── Personal Message (textarea)
├── Anonymous Gift? (checkbox)
└── Delivery Instructions (optional)
```

### 4. Review & Payment
```
├── Gift Summary
├── Delivery Address
├── Shipping Fee (auto-calculated)
├── Total Amount
└── Pay Now (deduct from balance)
```

### 5. Order Confirmation
```
├── Order Number: GFT-2025-001234
├── Tracking Link: yourdomain.com/track/GFT-TRK-ABC123
├── Share Link (WhatsApp, SMS, Email)
└── Estimated Delivery: December 25, 2025
```

---

## 🔧 TECHNICAL IMPLEMENTATION

### Required API Services
```javascript
// 1. Countries/States/Cities
const countriesApi = new CountriesNowAPI();

// 2. Geocoding & Maps
const geocodingApi = new NominatimAPI();
const mapService = new LeafletService();

// 3. Distance Calculation
const distanceCalculator = new HaversineCalculator();

// 4. Notifications
const emailService = new EmailService();
const smsService = new SMSService(); // optional
```

### Key Components to Build
1. **AddressSelector** - Country/State/City dropdowns
2. **MapConfirmation** - Interactive map with pin
3. **SavedAddresses** - Manage saved addresses
4. **ShippingCalculator** - Real-time fee calculation
5. **OrderTracker** - Public tracking page
6. **AdminDashboard** - Order management
7. **CustomRequestForm** - "Can't find what you're looking for?"

This structure gives you a complete, scalable gift delivery platform with precise addressing, saved addresses, map confirmation, and dynamic shipping calculations.