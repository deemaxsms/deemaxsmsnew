import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_PUBLIC_FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_PUBLIC_FIREBASE_AUTH_DOMAIN || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "deemax-3223e.firebaseapp.com",
  projectId: import.meta.env.VITE_PUBLIC_FIREBASE_PROJECT_ID || import.meta.env.VITE_FIREBASE_PROJECT_ID || "deemax-3223e",
  storageBucket: import.meta.env.VITE_PUBLIC_FIREBASE_STORAGE_BUCKET || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "deemax-3223e.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1014783991061",
  appId: import.meta.env.VITE_PUBLIC_FIREBASE_APP_ID || import.meta.env.VITE_FIREBASE_APP_ID || "1:1014783991061:web:f56670f29bb8c933915d1c",
  measurementId: import.meta.env.VITE_PUBLIC_FIREBASE_MEASUREMENT_ID || import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-ERDNKJGP2D",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const firebaseAuth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Configure Google provider
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export default app;
