import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore'; // Added for direct admin lookup
import { firebaseAuth, db } from '@/lib/firebase'; // Ensure db is exported from your firebase config
import { adminService } from '../lib/admin-service';
import { UserProfile } from '@/lib/firestore-service';

interface AdminAuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const loadProfile = async (firebaseUser: User) => {
    try {
      // 1. Check the new dedicated 'admins' collection
      const adminDocRef = doc(db, 'admins', firebaseUser.uid);
      const adminSnap = await getDoc(adminDocRef);
      
      const isAuthorizedEmail = adminService.isAdminEmail(firebaseUser.email || '');

      if (adminSnap.exists()) {
        // User exists in the admins collection
        const adminData = adminSnap.data() as UserProfile;
        setProfile(adminData);
        setIsAdmin(true);
      } else if (isAuthorizedEmail) {
        // Email is authorized but doc doesn't exist yet (Bootstrap phase)
        setProfile(null);
        setIsAdmin(true);
      } else {
        // Not an admin in any way
        setProfile(null);
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Error loading admin profile:', error);
      setProfile(null);
      setIsAdmin(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user);
    }
  };

  const signOut = async () => {
    try {
      await firebaseAuth.signOut();
      setUser(null);
      setProfile(null);
      setIsAdmin(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (currentUser) => {
      setUser(currentUser);
      setLoading(true);
      
      if (currentUser) {
        // Load profile using the new logic
        await loadProfile(currentUser);
      } else {
        setProfile(null);
        setIsAdmin(false);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AdminAuthContext.Provider value={{
      user,
      profile,
      loading,
      isAdmin,
      signOut,
      refreshProfile
    }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}