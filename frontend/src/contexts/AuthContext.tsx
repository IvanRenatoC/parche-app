import {
  createContext,
  useCallback,
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
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import type { User } from '../types';

interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  appUser: User | null;
  loading: boolean;
  bootstrapped: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  logOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshAppUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function friendlyAuthError(message: string): string {
  if (message.includes('invalid-credential') || message.includes('wrong-password') || message.includes('user-not-found')) {
    return 'Email o contraseña incorrectos';
  }
  if (message.includes('email-already-in-use')) {
    return 'Ya existe una cuenta con este email';
  }
  if (message.includes('weak-password')) {
    return 'La contraseña debe tener al menos 6 caracteres';
  }
  if (message.includes('invalid-email')) {
    return 'Email inválido';
  }
  if (message.includes('popup-closed-by-user')) {
    return 'Cancelaste el inicio de sesión con Google';
  }
  if (message.includes('network-request-failed')) {
    return 'Sin conexión. Revisa tu internet.';
  }
  return message;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [appUser, setAppUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [bootstrapped, setBootstrapped] = useState(false);

  const loadAppUser = useCallback(async (fbUser: FirebaseUser): Promise<User | null> => {
    const ref = doc(db, 'users', fbUser.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as User;
      setAppUser(data);
      return data;
    }
    setAppUser(null);
    return null;
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          await loadAppUser(fbUser);
        } catch (err) {
          console.error('No se pudo cargar el perfil:', err);
          setAppUser(null);
        }
      } else {
        setAppUser(null);
      }
      setLoading(false);
      setBootstrapped(true);
    });
    return unsubscribe;
  }, [loadAppUser]);

  async function signIn(email: string, password: string) {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al iniciar sesión';
      throw new Error(friendlyAuthError(msg));
    }
  }

  async function signInWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error con Google';
      throw new Error(friendlyAuthError(msg));
    }
  }

  async function signUp(email: string, password: string) {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error en el registro';
      throw new Error(friendlyAuthError(msg));
    }
  }

  async function logOut() {
    await signOut(auth);
    setAppUser(null);
  }

  async function resetPassword(email: string) {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al enviar correo';
      throw new Error(friendlyAuthError(msg));
    }
  }

  const refreshAppUser = useCallback(async (): Promise<User | null> => {
    if (!firebaseUser) return null;
    return await loadAppUser(firebaseUser);
  }, [firebaseUser, loadAppUser]);

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        appUser,
        loading,
        bootstrapped,
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
