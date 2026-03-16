# SMS API Integration

This directory contains the SMS API integration with Tellabot for SMS number rentals and verification services.

## Structure

- `index.ts` - Main exports and combined API service
- `utils.ts` - Common utilities, API calling functions, and balance management
- `balance-services.ts` - Balance checking and service listing APIs
- `one-time-mdn.ts` - One-time MDN rental APIs (request, status, reject, read/send SMS)
- `long-term-rental.ts` - Long-term MDN rental APIs (rent, status, activate, release, etc.)

## Key Features

- **50% Markup**: All prices include a 50% markup on Tellabot's base prices
- **Balance Deduction**: Automatically deducts from user balance before API calls
- **Order Tracking**: Creates Firestore records for all SMS orders with full lifecycle tracking
- **Error Handling**: Comprehensive error messages and status management
- **Type Safety**: Full TypeScript support with proper interfaces

## API Key

The API key is configured in `utils.ts`:
```
const API_KEY = "li7N6KjtJBJZa2irO7c8zCdVlYGps9jN";
```

## Usage

```typescript
import { smsApi } from "@/api/sms-api";

// Get available services
const services = await smsApi.getServices();

// Request one-time SMS number
const result = await smsApi.requestMDN(userId, "Google");

// Rent long-term number
const rental = await smsApi.rentLTR(userId, "Amazon", 30);

// Read SMS messages
const messages = await smsApi.readSMS(orderId);
```

## Order Status Tracking

SMS orders are tracked in Firestore with the following statuses:
- `pending` - Order created, waiting for processing
- `awaiting_mdn` - Priority request waiting for number assignment
- `reserved` - Number assigned and reserved
- `active` - Long-term rental is active
- `completed` - One-time order completed
- `rejected` - Order rejected
- `timed_out` - Priority request timed out
- `cancelled` - Order cancelled by user
- `expired` - Long-term rental expired

## Balance Management

- All purchases automatically deduct from user balance
- Insufficient balance prompts user to top up
- Transactions are recorded with detailed descriptions
- Balance validation happens before API calls to Tellabot

## Error Messages

All API functions provide clear, user-friendly error messages:
- "Insufficient balance. Please top up your account."
- "Service not found"
- "Failed to communicate with SMS service provider"
- Specific Tellabot API error messages are passed through

## Future Enhancements

- SMS message caching in localStorage for better performance
- Real-time status updates via WebSockets
- Bulk SMS operations
- Advanced filtering and search for SMS messages