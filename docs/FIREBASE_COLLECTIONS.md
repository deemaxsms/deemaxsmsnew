# Firebase Collections Structure

This document outlines all Firebase Firestore collections used in the SMSGlobe application.

## Collections

### `users`
User profiles and account information.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Firebase Auth UID (document ID) |
| `email` | string | User's email address |
| `displayName` | string | User's display name |
| `photoURL` | string | Profile photo URL |
| `balance` | number | Account balance in USD |
| `cashback` | number | Cashback balance in USD |
| `useCashbackFirst` | boolean | Whether to use cashback before main balance |
| `referralCode` | string | Unique referral code |
| `referredBy` | string | UID of referrer (if any) |
| `referralCount` | number | Number of successful referrals |
| `referralEarnings` | number | Total earnings from referrals |
| `apiKey` | string | API key for external access |
| `createdAt` | timestamp | Account creation date |
| `updatedAt` | timestamp | Last update date |

### `balance_transactions`
All balance-related transactions (deposits, withdrawals, purchases, refunds).

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Auto-generated document ID |
| `userId` | string | User's Firebase UID |
| `type` | string | Transaction type: `deposit`, `withdrawal`, `purchase`, `refund`, `referral_bonus` |
| `amount` | number | Transaction amount in USD |
| `amountNGN` | number | Original amount in NGN (for deposits) |
| `description` | string | Human-readable description |
| `balanceAfter` | number | Balance after this transaction |
| `reference` | string | External reference (tx_ref, order_id, etc.) |
| `createdAt` | timestamp | Transaction date |

### `deposits`
Payment deposit records.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Auto-generated document ID |
| `userId` | string | User's Firebase UID |
| `amountUSD` | number | Amount in USD |
| `amountNGN` | number | Amount in NGN (charged) |
| `exchangeRate` | number | USD to NGN rate used |
| `status` | string | `pending`, `completed`, `failed` |
| `paymentMethod` | string | `flutterwave`, `crypto` |
| `txRef` | string | Transaction reference |
| `transactionId` | string | Flutterwave transaction ID |
| `createdAt` | timestamp | Deposit initiated date |
| `completedAt` | timestamp | Deposit completion date |

### `activations`
SMS activation orders.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Auto-generated document ID |
| `userId` | string | User's Firebase UID |
| `service` | string | Service name (e.g., WhatsApp, Telegram) |
| `serviceCode` | string | Service code |
| `country` | string | Country name |
| `countryCode` | string | Country code |
| `phoneNumber` | string | Virtual phone number |
| `status` | string | `pending`, `waiting`, `active`, `completed`, `cancelled` |
| `smsCode` | string | Received SMS verification code |
| `smsText` | string | Full SMS text |
| `price` | number | Price paid in USD |
| `externalId` | string | External API activation ID |
| `activationType` | string | `activation`, `rental`, `voice`, `multi_sms` |
| `rentalDays` | number | Rental duration (if rental) |
| `expiresAt` | timestamp | Expiration time |
| `createdAt` | timestamp | Order creation date |
| `updatedAt` | timestamp | Last update date |

### `crypto_payments`
Cryptocurrency payment records.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Auto-generated document ID |
| `userId` | string | User's Firebase UID |
| `amountUSD` | number | Amount in USD |
| `amountCrypto` | number | Amount in cryptocurrency |
| `cryptoCurrency` | string | Crypto type (BTC, ETH, USDT, etc.) |
| `walletAddress` | string | Destination wallet address |
| `status` | string | `pending`, `confirmed`, `completed`, `expired` |
| `txHash` | string | Blockchain transaction hash |
| `createdAt` | timestamp | Payment initiated date |
| `completedAt` | timestamp | Payment completion date |

### `settings`
Application settings (admin managed).

| Field | Type | Description |
|-------|------|-------------|
| `usdToNgnRate` | number | Current USD to NGN exchange rate |
| `priceMarkup` | number | Price markup percentage (e.g., 0.15 for 15%) |
| `minDeposit` | number | Minimum deposit amount in USD |
| `maxDeposit` | number | Maximum deposit amount in USD |
| `updatedAt` | timestamp | Last settings update |

## Currency Handling

- **Display Currency**: USD (all prices shown to users)
- **Payment Currency**: NGN (for Flutterwave payments)
- **Exchange Rate**: Fetched from settings or API, applied at payment time
- **Storage**: All amounts stored in USD for consistency

## Exchange Rate Flow

1. User enters amount in USD
2. System fetches current USD/NGN rate
3. Amount is converted to NGN for Flutterwave payment
4. After successful payment, USD amount is credited to balance
5. Both USD and NGN amounts are stored in deposit record

---

### `services`
Repository of available services (SMS numbers, eSIMs, VPN, proxies, etc.) used to populate product listings and marketplace pages.

### `product_listings`
Admin-managed product definitions used in the public marketplace (cards, images, price, region, duration, isActive, etc.)

### `product_orders`
Orders placed by users when they purchase a product listing. Admins fulfill orders and can add `deliveryDetails` (VPN credentials, eSIM QR, etc.).

### `admin-auth-email`
Optional allow-list collection or single-document config that contains emails allowed to become admin accounts (for onboarding / manual creation). Alternatively the app may keep an `isAdmin` flag on the `users` document.

### `support_conversations` / `support_messages`
Collections for in-app support messages and conversation threads between users and support staff.

### `users` (note)
We also recommend keeping an `isAdmin` boolean on `users/{uid}` for quick checks; the allow-list can be used during initial onboarding to grant that flag only to approved emails.
