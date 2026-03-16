// Authentication test utilities
import { firebaseAuth } from "./firebase";
import { logDomainInfo, isAuthorizedDomain, shouldUseRecaptcha } from "./domain-utils";

export const runAuthTests = () => {
  console.log("🔍 Running Authentication Tests...");
  
  // Test 1: Domain configuration
  console.log("\n1. Domain Configuration:");
  logDomainInfo();
  
  // Test 2: Firebase initialization
  console.log("\n2. Firebase Auth Status:");
  console.log("Firebase Auth initialized:", !!firebaseAuth);
  console.log("Current user:", firebaseAuth.currentUser?.email || "None");
  
  // Test 3: Environment variables
  console.log("\n3. Environment Variables:");
  console.log("Firebase API Key:", import.meta.env.VITE_PUBLIC_FIREBASE_API_KEY ? "✅ Set" : "❌ Missing");
  console.log("Firebase Auth Domain:", import.meta.env.VITE_PUBLIC_FIREBASE_AUTH_DOMAIN ? "✅ Set" : "❌ Missing");
  console.log("Firebase Project ID:", import.meta.env.VITE_PUBLIC_FIREBASE_PROJECT_ID ? "✅ Set" : "❌ Missing");
  console.log("reCAPTCHA Site Key:", import.meta.env.VITE_PUBLIC_RECAPTCHA_SITE_KEY ? "✅ Set" : "❌ Missing");
  
  // Test 4: Domain authorization
  console.log("\n4. Domain Authorization:");
  console.log("Current domain authorized:", isAuthorizedDomain() ? "✅ Yes" : "❌ No");
  console.log("Should use reCAPTCHA:", shouldUseRecaptcha() ? "✅ Yes" : "❌ No");
  
  // Test 5: Configuration recommendations
  console.log("\n5. Configuration Status:");
  const hostname = typeof window !== "undefined" ? window.location.hostname : "unknown";
  
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    console.log("🏠 Development environment detected");
    console.log("- reCAPTCHA should be disabled");
    console.log("- Google OAuth should work without additional setup");
  } else if (hostname.endsWith(".vercel.app")) {
    console.log("🚀 Vercel deployment detected");
    console.log("- Ensure domain is added to Firebase authorized domains");
    console.log("- Ensure domain is added to Google OAuth settings");
    console.log("- Ensure domain is added to reCAPTCHA settings");
  } else if (hostname.endsWith(".firebaseapp.com")) {
    console.log("🔥 Firebase hosting detected");
    console.log("- Domain should be automatically authorized");
    console.log("- Check Google OAuth and reCAPTCHA settings");
  } else {
    console.log("🌐 Custom domain detected");
    console.log("- Ensure domain is added to all service configurations");
  }
  
  console.log("\n✅ Authentication test complete. Check console output above for any issues.");
};

// Auto-run tests in development
if (import.meta.env.DEV) {
  // Run tests after a short delay to ensure everything is loaded
  setTimeout(runAuthTests, 1000);
}