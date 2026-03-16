/* eslint-disable @typescript-eslint/no-explicit-any */
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  User
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp, collection, query, where, getDocs } from "firebase/firestore";
import { firebaseAuth, db, googleProvider } from "./firebase";

export interface AuthState {
  user: User | null;
  loading: boolean;
}

export const firebaseAuthService = {
  // Email/Password Sign Up
  async signUp(email: string, password: string, username?: string, recaptchaToken?: string) {
    try {
      console.log('Starting signup process for:', email);
      
      // Check username availability if provided
      if (username) {
        console.log('Checking username availability:', username);
        // Check the usernames collection (public readable)
        const usernameDocRef = doc(db, "usernames", username.toLowerCase());
        const usernameDoc = await getDoc(usernameDocRef);
        if (usernameDoc.exists()) {
          console.log('Username already taken:', username);
          return { user: null, error: "Username is already taken" };
        }
      }

      console.log('Creating Firebase Auth user...');
      const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      const user = userCredential.user;
      console.log('Firebase Auth user created:', user.uid);
      
      try {
        // Reserve username in usernames collection if provided
        if (username) {
          console.log('Reserving username:', username);
          await setDoc(doc(db, "usernames", username.toLowerCase()), {
            userId: user.uid,
            createdAt: serverTimestamp()
          });
          console.log('Username reserved successfully');
        }
        
        // Create user profile in Firestore
        console.log('Creating user profile in Firestore...');
        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          username: username?.toLowerCase() || null,
          balance: 0,
          cashback: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          useCashbackFirst: true,
          referralCode: generateReferralCode(),
          referredBy: null,
          referralCount: 0,
          referralEarnings: 0
        });
        console.log('User profile created successfully');
        
        return { user, error: null };
      } catch (firestoreError: any) {
        console.error('Firestore error during signup:', firestoreError);
        // If Firestore operations fail, we should still return the user
        // The profile can be created later
        return { 
          user, 
          error: `Account created but profile setup incomplete: ${firestoreError.message}` 
        };
      }
    } catch (error: any) {
      console.error('Firebase Auth error during signup:', error);
      
      // Handle specific Firebase Auth errors
      if (error.code === 'auth/email-already-in-use') {
        return { user: null, error: "An account with this email already exists" };
      } else if (error.code === 'auth/weak-password') {
        return { user: null, error: "Password should be at least 6 characters" };
      } else if (error.code === 'auth/invalid-email') {
        return { user: null, error: "Invalid email address" };
      } else if (error.code === 'auth/operation-not-allowed') {
        return { user: null, error: "Email/password accounts are not enabled" };
      } else {
        return { user: null, error: error.message || "Failed to create account" };
      }
    }
  },

  // Email/Password Sign In (supports email OR username)
  async signIn(identifier: string, password: string, p0?: { recaptchaToken: string; }) {
    try {
      let email = identifier;
      
      // Check if identifier is username (doesn't contain @)
      if (!identifier.includes('@')) {
        const usernameQuery = query(
          collection(db, "users"),
          where("username", "==", identifier.toLowerCase())
        );
        const snapshot = await getDocs(usernameQuery);
        
        if (snapshot.empty) {
          return { user: null, error: "User not found" };
        }
        
        email = snapshot.docs[0].data().email;
      }

      const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
      return { user: userCredential.user, error: null };
    } catch (error: any) {
      return { user: null, error: error.message };
    }
  },

  // Google Sign In
  async signInWithGoogle() {
    try {
      const result = await signInWithPopup(firebaseAuth, googleProvider);
      const user = result.user;
      
      // Check if user profile exists, if not create one
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          username: null,
          displayName: user.displayName,
          photoURL: user.photoURL,
          balance: 0,
          cashback: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          useCashbackFirst: true,
          referralCode: generateReferralCode(),
          referredBy: null,
          referralCount: 0,
          referralEarnings: 0
        });
      }
      
      return { user, error: null };
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      
      // Handle specific Google auth errors
      if (error.code === 'auth/unauthorized-domain') {
        return { 
          user: null, 
          error: 'This domain is not authorized for Google sign-in. Please contact support or try email/password signup.' 
        };
      } else if (error.code === 'auth/popup-blocked') {
        // Try redirect as fallback
        try {
          await signInWithRedirect(firebaseAuth, googleProvider);
          return { user: null, error: null };
        } catch (redirectError: any) {
          console.error('Google redirect error:', redirectError);
          return { 
            user: null, 
            error: 'Google sign-in was blocked. Please allow popups or try email/password signup.' 
          };
        }
      } else if (error.code === 'auth/popup-closed-by-user') {
        return { user: null, error: 'Sign-in was cancelled. Please try again.' };
      } else if (error.code === 'auth/network-request-failed') {
        return { user: null, error: 'Network error. Please check your connection and try again.' };
      } else {
        // Try redirect as fallback for other errors
        try {
          await signInWithRedirect(firebaseAuth, googleProvider);
          return { user: null, error: null };
        } catch (redirectError: any) {
          console.error('Google redirect fallback error:', redirectError);
          return { 
            user: null, 
            error: error.message || 'Google sign-in failed. Please try email/password signup.' 
          };
        }
      }
    }
  },

  // Sign Out
  async signOut() {
    try {
      await signOut(firebaseAuth);
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  },

  // Get current user
  getCurrentUser() {
    return firebaseAuth.currentUser;
  },

  // Auth state listener
  onAuthStateChange(callback: (user: User | null) => void) {
    return firebaseAuth.onAuthStateChanged(callback);
  }
};

// Generate a random referral code
function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
