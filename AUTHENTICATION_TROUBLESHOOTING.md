# Authentication Troubleshooting Guide

## Quick Fixes Applied

### 1. Domain Configuration Updates
- Added comprehensive domain checking
- Updated production domain detection
- Added fallback handling for reCAPTCHA failures

### 2. Error Handling Improvements
- Better Google OAuth error messages
- Graceful reCAPTCHA failure handling
- Domain authorization error handling

### 3. TypeScript Fixes
- Added `@types/react-google-recaptcha` package
- Fixed type errors

## Manual Configuration Required

### Firebase Console Settings

1. **Go to Firebase Console → Authentication → Settings → Authorized domains**
   Add these domains:
   ```
   localhost
   sms-globe.firebaseapp.com
   smsglobal.vercel.app
   app.smsglobe.net
   ```

2. **Go to Firebase Console → Authentication → Sign-in method**
   - Enable Email/Password
   - Enable Google (if using Google OAuth)

### Google Cloud Console Settings

1. **Go to Google Cloud Console → APIs & Services → Credentials**
2. **Find your OAuth 2.0 client ID and edit it**
3. **Add Authorized JavaScript origins:**
   ```
   https://sms-globe.firebaseapp.com
   https://smsglobal.vercel.app
   https://app.smsglobe.net
   http://localhost:3000
   http://localhost:5173
   ```

4. **Add Authorized redirect URIs:**
   ```
   https://sms-globe.firebaseapp.com__/auth/handler
   https://smsglobal.vercel.app/__/auth/handler
   https://app.smsglobe.net/__/auth/handler
   http://localhost:3000/__/auth/handler
   http://localhost:5173/__/auth/handler
   ```

### Google reCAPTCHA Console Settings

1. **Go to Google reCAPTCHA Console**
2. **Edit your reCAPTCHA site**
3. **Add these domains:**
   ```
   localhost
   sms-globe.firebaseapp.com
   smsglobal.vercel.app
   app.smsglobe.net
   ```

### Vercel Environment Variables

Make sure these are set in your Vercel dashboard:
```
VITE_PUBLIC_FIREBASE_API_KEY=AIzaSyDDWTZuAWy4R7YtaaF256fP0UN1W5RgQjs
VITE_PUBLIC_FIREBASE_AUTH_DOMAIN=deemax-3223e.firebaseapp.com
VITE_PUBLIC_FIREBASE_PROJECT_ID=deemax-3223e
VITE_PUBLIC_RECAPTCHA_SITE_KEY=6LcAZhArAAAAAENVbmQeybpN_zG1JrrZ4IFXakdJ
```

## Testing Steps

1. **Test locally first:**
   ```bash
   npm run dev
   ```
   - Try email/password signup
   - Try Google OAuth (should work without reCAPTCHA)

2. **Test on Vercel:**
   - Deploy your changes
   - Test email/password signup with reCAPTCHA
   - Test Google OAuth

3. **Check browser console for errors:**
   - Look for domain authorization errors
   - Check for reCAPTCHA errors
   - Verify Firebase initialization

## Common Error Messages and Solutions

### "This domain is not authorized for OAuth"
- Add domain to Google Cloud Console OAuth settings
- Add domain to Firebase authorized domains

### "reCAPTCHA verification failed"
- Add domain to Google reCAPTCHA console
- Check if reCAPTCHA site key is correct

### "Firebase: Error (auth/unauthorized-domain)"
- Add domain to Firebase Console → Authentication → Settings → Authorized domains

### "Network request failed"
- Check internet connection
- Verify Firebase configuration
- Check if Firebase services are enabled

## Debug Information

The app now logs domain information to the console. Check the browser console for:
```
Domain Debug Info: {
  hostname: "your-domain.com",
  origin: "https://your-domain.com",
  protocol: "https:",
  isAuthorized: true,
  isProduction: true,
  shouldUseRecaptcha: true,
  redirectUrl: "https://your-domain.com/__/auth/handler"
}
```

## Next Steps

1. Apply the manual configuration changes above
2. Test authentication on both development and production
3. Monitor browser console for any remaining errors
4. Contact support if issues persist after following this guide