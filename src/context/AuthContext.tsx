import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

type Role = 'admin' | 'resident' | null;

interface AuthState {
  role: Role;
  flatId?: string;
  residentName?: string;
  flatName?: string;
  userId?: string;
}

interface AuthContextType {
  auth: AuthState;
  loading: boolean;
  logout: () => Promise<void>;
  forceRefresh: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>({ role: null });
  const [loading, setLoading] = useState(true);
  const [refreshIter, setRefreshIter] = useState(0);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (isMounted) {
          setAuthState({ role: null });
          setLoading(false);
        }
        return;
      }

      try {
        // Quick check for admin based on email
        // If you define admin accounts via a specific domain or 'admin' prefix:
        if (user.email && (user.email.startsWith('admin') || user.email.includes('unitysquare.com'))) {
          if (isMounted) {
            setAuthState({ role: 'admin', residentName: 'Admin', flatName: 'Management', userId: user.uid });
            setLoading(false);
          }
          return;
        }

        // Query Firestore for a resident record linked to this UID
        const q = query(collection(db, 'residents'), where('userId', '==', user.uid));
        const snap = await getDocs(q);
        
        if (!snap.empty) {
          const resData = snap.docs[0].data();
          let flatName = 'Unknown Unit';
          
          if (resData.flatId) {
            const flatDoc = await getDoc(doc(db, 'flats', resData.flatId));
            if (flatDoc.exists()) {
              const fData = flatDoc.data();
              flatName = `${fData.wing}-${fData.flatNo}`;
            }
          }

          if (isMounted) {
            setAuthState({ 
              role: 'resident', 
              flatId: resData.flatId, 
              residentName: resData.name, 
              flatName, 
              userId: user.uid 
            });
          }
        } else {
           if (isMounted) setAuthState({ role: null });
        }
      } catch (error) {
        console.error("Auth resolve error:", error);
        if (isMounted) setAuthState({ role: null });
      } finally {
        if (isMounted) setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [refreshIter]);

  const logout = async () => {
    setLoading(true);
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ auth: authState, loading, logout, forceRefresh: () => setRefreshIter(i => i + 1) }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
