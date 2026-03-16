# TellaBot API Setup Guide

## Prerequisites

1. **TellaBot Account**: You need a TellaBot account with API access
2. **API Credentials**: Generate your API key from your TellaBot profile page

## Setup Steps

### 1. Get TellaBot API Credentials

1. Go to [TellaBot.com](https://www.tellabot.com)
2. Log in to your account
3. Navigate to "Edit Profile" page
4. Generate an API key (requires email confirmation)
5. Note down your username/email and API key

### 2. Configure Environment Variables

Create a `.env.local` file in your project root and add:

```env
# TellaBot API Configuration
VITE_TELLABOT_USER=your_tellabot_username_or_email
VITE_TELLABOT_API_KEY=your_tellabot_api_key
```

**Important**: 
- Replace `your_tellabot_username_or_email` with your actual TellaBot username or email
- Replace `your_tellabot_api_key` with your actual API key
- Never commit these credentials to version control

### 3. Test the Integration

1. Start your development server: `npm run dev`
2. Navigate to the SMS Globe page
3. Try to load services - you should see available services from TellaBot
4. Test ordering a number with a small amount

## Features Implemented

✅ **Service Loading**: Fetches available services from TellaBot API with 50% markup  
✅ **One-time Numbers**: Request temporary US phone numbers (15-minute duration)  
✅ **Long-term Rentals**: Rent numbers for 3 or 30 days  
✅ **SMS Polling**: Automatically checks for incoming SMS messages  
✅ **Automatic Refunds**: Refunds users if no SMS is received within the timeout period  
✅ **Balance Integration**: Deducts from user balance and processes refunds  
✅ **Error Handling**: User-friendly error messages for network issues, insufficient balance, etc.  
✅ **Service Icons**: Visual service icons for better UX  
✅ **Search & Filter**: Search services and popular services section  
✅ **50% Markup**: All prices include 50% markup on TellaBot base prices  
✅ **Fallback Pricing**: Graceful handling when API returns invalid pricing data  

## API Endpoints Used

- `cmd=list_services` - Get available services with pricing
- `cmd=request` - Request a new phone number
- `cmd=request_status` - Check request status
- `cmd=read_sms` - Read incoming SMS messages
- `cmd=reject` - Cancel/reject a request
- `cmd=ltr_rent` - Rent long-term numbers
- `cmd=ltr_status` - Check long-term rental status
- `cmd=ltr_release` - Release long-term rentals

## Error Handling

The system provides clear error messages for common issues:

- **Network Issues**: "Network connection issue. Please check your internet connection and try again."
- **Insufficient Balance**: Shows exact amount needed and current balance
- **No Numbers Available**: "No phone numbers are currently available for this service. Please try again in a few minutes."
- **Service Configuration**: "Service configuration issue. Please contact support."

## Automatic Refund System

- **One-time Numbers**: If no SMS is received within 15 minutes, automatic refund is processed
- **Cancelled Orders**: Immediate refund for orders cancelled before receiving SMS
- **Failed Orders**: Automatic refund if the TellaBot API request fails

## Support

If you encounter issues:

1. Check your API credentials are correct
2. Verify your TellaBot account has sufficient balance
3. Check the browser console for detailed error messages
4. Ensure your internet connection is stable

For TellaBot-specific issues, contact TellaBot support directly.