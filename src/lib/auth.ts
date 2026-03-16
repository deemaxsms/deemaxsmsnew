import { firebaseAuthService } from "./firebase-auth";
import { sendPasswordResetEmail } from "firebase/auth";
import { firebaseAuth } from "./firebase";

export const auth = {
  async signUp(email: string, password: string) {
    return firebaseAuthService.signUp(email, password);
  },

  async signIn(email: string, password: string) {
    return firebaseAuthService.signIn(email, password);
  },

  async signOut() {
    return firebaseAuthService.signOut();
  },

  async getSession() {
    const user = firebaseAuthService.getCurrentUser();
    return { session: user ? { user } : null, error: null };
  },

  onAuthStateChange(callback: (session: any | null, user: any | null) => void) {
    return firebaseAuthService.onAuthStateChange((user) => {
      const session = user ? { user } : null;
      callback(session, user ?? null);
    });
  },

  async sendPasswordReset(email: string) {
    try {
      await sendPasswordResetEmail(firebaseAuth, email, { url: window.location.origin });
      return { data: true, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  async signInWithGoogle() {
    return firebaseAuthService.signInWithGoogle();
  },
};
