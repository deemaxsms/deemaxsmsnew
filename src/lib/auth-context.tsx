import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { User } from "firebase/auth";
import { firebaseAuthService } from "./firebase-auth";
import { firestoreService, UserProfile } from "./firestore-service";
import { balanceManager } from "./balance-manager";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setProfileLocal?: (profile: UserProfile | null) => void;
  updateBalance: (newBalance: number) => void;
  addToBalance: (amount: number) => void;
  deductFromBalance: (amount: number) => void;
  syncBalance: () => Promise<void>;
  processPurchase: (amount: number, description: string, orderId?: string) => Promise<{ success: boolean; error?: string }>;
  processDeposit: (amount: number, description: string, txRef?: string, transactionId?: string) => Promise<{ success: boolean; error?: string }>;
  verifyBalance: () => Promise<{ 
    isValid: boolean; 
    discrepancy: number; 
    transactionCount: number;
    currentBalance?: number;
    calculatedBalance?: number;
    lastTransactionDate?: Date;
  }>;
  fixBalance: () => Promise<{ 
    success: boolean; 
    error?: string;
    correctionAmount?: number;
    transactionId?: string;
  }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (uid: string) => {
    try {
      const userProfile = await firestoreService.getUserProfile(uid);
      setProfile(userProfile);
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const setProfileLocal = (p: UserProfile | null) => setProfile(p);

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user.uid);
    }
  };

  // Instant balance update functions
  const updateBalance = (newBalance: number) => {
    if (profile) {
      setProfile({ ...profile, balance: newBalance });
    }
  };

  const addToBalance = (amount: number) => {
    if (profile) {
      const newBalance = (profile.balance || 0) + amount;
      setProfile({ ...profile, balance: newBalance });
      console.log(`💰 Balance updated: +$${amount} → $${newBalance.toFixed(2)}`);
    }
  };

  const deductFromBalance = (amount: number) => {
    if (profile) {
      const newBalance = Math.max(0, (profile.balance || 0) - amount);
      setProfile({ ...profile, balance: newBalance });
      console.log(`💸 Balance updated: -$${amount} → $${newBalance.toFixed(2)}`);
    }
  };

  // Sync balance from Firestore (for error recovery)
  const syncBalance = async () => {
    if (user) {
      try {
        const currentBalance = await balanceManager.getCurrentBalance(user.uid);
        if (profile) {
          setProfile({ ...profile, balance: currentBalance });
        }
      } catch (error) {
        console.error("Error syncing balance:", error);
      }
    }
  };

  // Process purchase with proper balance management
  const processPurchase = async (amount: number, description: string, orderId?: string) => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const result = await balanceManager.processPurchase(user.uid, amount, description, orderId);
      
      if (result.success) {
        // Update local profile
        if (profile) {
          setProfile({ ...profile, balance: result.newBalance });
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error processing purchase:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  };

  // Process deposit with proper balance management
  const processDeposit = async (amount: number, description: string, txRef?: string, transactionId?: string) => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const result = await balanceManager.processDeposit(user.uid, amount, description, txRef, transactionId);
      
      if (result.success) {
        // Update local profile
        if (profile) {
          setProfile({ ...profile, balance: result.newBalance });
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error processing deposit:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  };

  // Verify balance integrity
  const verifyBalance = async () => {
    if (!user) {
      return { isValid: false, discrepancy: 0, transactionCount: 0 };
    }

    try {
      const verification = await balanceManager.verifyBalanceIntegrity(user.uid);
      return {
        isValid: verification.isValid,
        discrepancy: verification.discrepancy,
        transactionCount: verification.transactionCount,
        currentBalance: verification.currentBalance,
        calculatedBalance: verification.calculatedBalance,
        lastTransactionDate: verification.lastTransactionDate
      };
    } catch (error) {
      console.error('Error verifying balance:', error);
      return { isValid: false, discrepancy: 0, transactionCount: 0 };
    }
  };

  // Fix balance discrepancies
  const fixBalance = async () => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const result = await balanceManager.fixBalanceDiscrepancy(user.uid);
      
      if (result.success) {
        // Update local profile
        if (profile) {
          setProfile({ ...profile, balance: result.newBalance });
        }
      }
      
      return {
        success: result.success,
        error: result.error,
        correctionAmount: result.correctionAmount,
        transactionId: result.transactionId
      };
    } catch (error) {
      console.error('Error fixing balance:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  };

  useEffect(() => {
    const unsubscribe = firebaseAuthService.onAuthStateChange(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await loadProfile(firebaseUser.uid);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    await firebaseAuthService.signOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      signOut, 
      refreshProfile, 
      setProfileLocal,
      updateBalance,
      addToBalance,
      deductFromBalance,
      syncBalance,
      processPurchase,
      processDeposit,
      verifyBalance,
      fixBalance
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // In development, this might happen due to hot reload
    if (process.env.NODE_ENV === 'development') {
      console.warn("useAuth called outside AuthProvider - this might be a hot reload issue");
      // Return a minimal context to prevent crashes during development
      return {
        user: null,
        profile: null,
        loading: true,
        signOut: async () => {},
        refreshProfile: async () => {},
        setProfileLocal: () => {},
        updateBalance: () => {},
        addToBalance: () => {},
        deductFromBalance: () => {},
        syncBalance: async () => {},
        processPurchase: async () => ({ success: false, error: 'Development mode' }),
        processDeposit: async () => ({ success: false, error: 'Development mode' }),
        verifyBalance: async () => ({ isValid: false, discrepancy: 0, transactionCount: 0 }),
        fixBalance: async () => ({ success: false, error: 'Development mode' })
      };
    }
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
