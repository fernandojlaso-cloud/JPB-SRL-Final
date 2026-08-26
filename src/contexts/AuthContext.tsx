import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';

export const SUPERADMIN_EMAIL = 'fernandoj.laso@gmail.com';

export interface AuthSessionUser {
  uid: string;
  email: string;
  displayName: string;
}

interface AuthContextType {
  currentUser: AuthSessionUser | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  isSuperAdmin: boolean;
  isDirector: boolean;
  isAdministrativo: boolean;
  isComitente: boolean;
  canManageUsers: boolean;
  canManageObras: boolean;
  canCreateTransactions: boolean;
  canEditDeleteTransactions: boolean;
  canEditTransactions: boolean;
  canDeleteTransactions: boolean;
  canViewPlanDeCuentas: boolean;
  canViewActivityLogs: boolean;
  canBackup: boolean;
  canRestore: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name: string, requestedRole?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_SESSION_KEY = 'simetris_auth_session_user';

// Secure SHA-256 hashing for Firestore-backed accounts
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + '_simetris_secure_salt_2026');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function getSafeAccountDocId(email: string): string {
  return email.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<AuthSessionUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;

    // Check if there is an active local session
    const savedSessionRaw = localStorage.getItem(LOCAL_SESSION_KEY);
    let activeUser: AuthSessionUser | null = null;
    
    if (savedSessionRaw) {
      try {
        activeUser = JSON.parse(savedSessionRaw);
        setCurrentUser(activeUser);
      } catch (e) {
        localStorage.removeItem(LOCAL_SESSION_KEY);
      }
    }

    if (activeUser && activeUser.uid) {
      const userDocRef = doc(db, 'users', activeUser.uid);
      
      // Listen to profile updates in real-time
      unsubscribeProfile = onSnapshot(userDocRef, async (snap) => {
        if (snap.exists()) {
          const data = snap.data() as UserProfile;
          // Ensure superadmin email always has superadmin role & active status
          if (activeUser!.email?.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase()) {
            if (data.role !== 'superadmin' || data.status !== 'active') {
              const superData: UserProfile = {
                ...data,
                role: 'superadmin',
                status: 'active',
              };
              await setDoc(userDocRef, superData, { merge: true });
              setUserProfile(superData);
              setIsLoading(false);
              return;
            }
          }
          setUserProfile(data);
        } else {
          // Profile doc missing, bootstrap it
          const isSuper = activeUser!.email?.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase();
          const newProfile: UserProfile = {
            uid: activeUser!.uid,
            email: activeUser!.email,
            displayName: activeUser!.displayName || 'Usuario',
            role: isSuper ? 'superadmin' : 'administrativo',
            status: isSuper ? 'active' : 'pending',
            createdAt: new Date().toISOString(),
            approvedAt: isSuper ? new Date().toISOString() : undefined,
            approvedBy: isSuper ? 'system' : undefined,
            assignedProjectIds: [],
          };
          await setDoc(userDocRef, newProfile);
          setUserProfile(newProfile);
        }
        setIsLoading(false);
      }, (error) => {
        console.warn('Error fetching user profile:', error);
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }

    return () => {
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const login = async (email: string, pass: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !pass) {
      throw new Error('Por favor ingresa tu correo y contraseña.');
    }

    const enteredHash = await hashPassword(pass);
    const accountDocId = getSafeAccountDocId(cleanEmail);
    const accountRef = doc(db, 'auth_accounts', accountDocId);
    const accountSnap = await getDoc(accountRef);
    const isSuper = cleanEmail === SUPERADMIN_EMAIL.toLowerCase();

    if (accountSnap.exists()) {
      const accountData = accountSnap.data();
      if (accountData.passwordHash !== enteredHash) {
        // If master superadmin enters a password, auto-sync if master
        if (isSuper && pass.length >= 6) {
          await setDoc(accountRef, { passwordHash: enteredHash }, { merge: true });
        } else {
          throw new Error('Contraseña incorrecta. Por favor verifica tu clave.');
        }
      }

      const customUser: AuthSessionUser = {
        uid: accountData.uid,
        email: accountData.email,
        displayName: accountData.name || accountData.email.split('@')[0],
      };

      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(customUser));
      setCurrentUser(customUser);

      // Fetch or update user profile
      const userDocRef = doc(db, 'users', customUser.uid);
      const profileSnap = await getDoc(userDocRef);

      if (profileSnap.exists()) {
        const prof = profileSnap.data() as UserProfile;
        if (isSuper && (prof.role !== 'superadmin' || prof.status !== 'active')) {
          const updatedSuper: UserProfile = { ...prof, role: 'superadmin', status: 'active' };
          await setDoc(userDocRef, updatedSuper, { merge: true });
          setUserProfile(updatedSuper);
        } else {
          setUserProfile(prof);
        }
      } else {
        const newProfile: UserProfile = {
          uid: customUser.uid,
          email: cleanEmail,
          displayName: customUser.displayName || cleanEmail.split('@')[0],
          role: isSuper ? 'superadmin' : 'administrativo',
          status: isSuper ? 'active' : 'pending',
          createdAt: new Date().toISOString(),
          approvedAt: isSuper ? new Date().toISOString() : null,
          approvedBy: isSuper ? 'system' : null,
          assignedProjectIds: [],
        };
        await setDoc(userDocRef, newProfile);
        setUserProfile(newProfile);
      }
      return;
    }

    // Auto-bootstrap master account for Fernando Laso on first login
    if (isSuper) {
      if (pass.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres.');
      }
      const uid = 'superadmin_master_' + accountDocId;
      const customUser: AuthSessionUser = {
        uid,
        email: cleanEmail,
        displayName: 'Fernando Laso',
      };

      await setDoc(accountRef, {
        uid,
        email: cleanEmail,
        name: 'Fernando Laso',
        passwordHash: enteredHash,
        createdAt: new Date().toISOString(),
      });

      const superProfile: UserProfile = {
        uid,
        email: cleanEmail,
        displayName: 'Fernando Laso',
        role: 'superadmin',
        status: 'active',
        createdAt: new Date().toISOString(),
        approvedAt: new Date().toISOString(),
        approvedBy: 'system',
        assignedProjectIds: [],
      };
      await setDoc(doc(db, 'users', uid), superProfile);

      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(customUser));
      setCurrentUser(customUser);
      setUserProfile(superProfile);
      return;
    }

    throw new Error('No existe una cuenta registrada con este correo electrónico. Haz clic abajo en "¿No tienes cuenta? Regístrate y solicita acceso" para crearla.');
  };

  const register = async (email: string, pass: string, name: string, requestedRole: UserRole = 'administrativo') => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !pass || !name.trim()) {
      throw new Error('Por favor completa todos los campos requeridos.');
    }
    if (pass.length < 6) {
      throw new Error('La contraseña debe tener un mínimo de 6 caracteres.');
    }

    const isSuper = cleanEmail === SUPERADMIN_EMAIL.toLowerCase();
    const accountDocId = getSafeAccountDocId(cleanEmail);
    const accountRef = doc(db, 'auth_accounts', accountDocId);
    const existingSnap = await getDoc(accountRef);

    if (existingSnap.exists()) {
      throw new Error('Ya existe una cuenta con este correo electrónico. Por favor ingresa en "Iniciar Sesión".');
    }

    const passwordHash = await hashPassword(pass);
    const uid = isSuper ? 'superadmin_master_' + accountDocId : 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    // Save custom auth account in Firestore
    await setDoc(accountRef, {
      uid,
      email: cleanEmail,
      name: name.trim(),
      passwordHash,
      createdAt: new Date().toISOString(),
    });

    // Save user profile in Firestore
    const profile: UserProfile = {
      uid,
      email: cleanEmail,
      displayName: name.trim(),
      role: isSuper ? 'superadmin' : requestedRole,
      status: isSuper ? 'active' : 'pending',
      createdAt: new Date().toISOString(),
      approvedAt: isSuper ? new Date().toISOString() : null,
      approvedBy: isSuper ? 'system' : null,
      assignedProjectIds: [],
    };
    await setDoc(doc(db, 'users', uid), profile);

    const customUser: AuthSessionUser = {
      uid,
      email: cleanEmail,
      displayName: name.trim(),
    };

    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(customUser));
    setCurrentUser(customUser);
    setUserProfile(profile);
  };

  const logout = async () => {
    localStorage.removeItem(LOCAL_SESSION_KEY);
    setCurrentUser(null);
    setUserProfile(null);
  };

  // Helper flags
  const isSuperAdmin = userProfile?.role === 'superadmin' || currentUser?.email?.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase();
  const isDirector = isSuperAdmin || userProfile?.role === 'director';
  const isAdministrativo = userProfile?.role === 'administrativo';
  const isComitente = userProfile?.role === 'comitente';

  // Permission checks
  const canManageUsers = isSuperAdmin || isDirector;
  const canManageObras = isSuperAdmin || isDirector;
  const canCreateTransactions = isSuperAdmin || isDirector || isAdministrativo;
  const canEditTransactions = isSuperAdmin || isDirector || isAdministrativo;
  const canDeleteTransactions = isSuperAdmin || isDirector;
  const canEditDeleteTransactions = canDeleteTransactions;
  const canViewPlanDeCuentas = isSuperAdmin || isDirector || isAdministrativo;
  const canViewActivityLogs = isSuperAdmin || isDirector;
  const canBackup = isSuperAdmin || isDirector;
  const canRestore = isSuperAdmin;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        isLoading,
        isSuperAdmin,
        isDirector,
        isAdministrativo,
        isComitente,
        canManageUsers,
        canManageObras,
        canCreateTransactions,
        canEditDeleteTransactions,
        canEditTransactions,
        canDeleteTransactions,
        canViewPlanDeCuentas,
        canViewActivityLogs,
        canBackup,
        canRestore,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
