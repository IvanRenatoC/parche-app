import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  type User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import type { User, UserRole } from '../types';

interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  appUser: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string, role: UserRole) => Promise<void>;
  logOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshAppUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [appUser, setAppUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadAppUser(fbUser: FirebaseUser) {
    const ref = doc(db, 'users', fbUser.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      setAppUser(snap.data() as User);
    } else {
      setAppUser(null);
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        await loadAppUser(fbUser);
      } else {
        setAppUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function signIn(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const fbUser = result.user;
    const ref = doc(db, 'users', fbUser.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      // New Google user — needs to complete profile
      await setDoc(ref, {
        uid: fbUser.uid,
        email: fbUser.email,
        role: null,
        rut: '',
        first_name: fbUser.displayName?.split(' ')[0] ?? '',
        last_name: fbUser.displayName?.split(' ').slice(1).join(' ') ?? '',
        profile_completed: false,
        email_verified: fbUser.emailVerified,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
    }
  }

  async function signUp(email: string, password: string, role: UserRole) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const ref = doc(db, 'users', cred.user.uid);
    await setDoc(ref, {
      uid: cred.user.uid,
      email,
      role,
      rut: '',
      first_name: '',
      last_name: '',
      profile_completed: false,
      email_verified: false,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
  }

  async function logOut() {
    await signOut(auth);
    setAppUser(null);
  }

  async function resetPassword(email: string) {
    await sendPasswordResetEmail(auth, email);
  }

  async function refreshAppUser() {
    if (firebaseUser) await loadAppUser(firebaseUser);
  }

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        appUser,
        loading,
        signIn,
        signInWithGoogle,
        signUp,
        logOut,
        resetPassword,
        refreshAppUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
