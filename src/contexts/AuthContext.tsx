import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

interface LocalAuthAccount {
  id: string;
  email: string;
  password: string;
  createdAt: string;
}

const LOCAL_AUTH_ACCOUNT_KEY = 'score-energy-local-auth-account';
const LOCAL_AUTH_SESSION_KEY = 'score-energy-local-auth-session';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const createMockUser = (account: Pick<LocalAuthAccount, 'id' | 'email' | 'createdAt'>): User =>
  ({
    id: account.id,
    email: account.email,
    aud: 'authenticated',
    role: 'authenticated',
    created_at: account.createdAt,
    app_metadata: { provider: 'local-fallback', providers: ['local-fallback'] },
    user_metadata: { mode: 'local-fallback' },
    identities: [],
  }) as User;

const readLocalAuthAccount = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(LOCAL_AUTH_ACCOUNT_KEY);
  return raw ? (JSON.parse(raw) as LocalAuthAccount) : null;
};

const readLocalAuthSession = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(LOCAL_AUTH_SESSION_KEY);
  return raw ? (JSON.parse(raw) as Omit<LocalAuthAccount, 'password'>) : null;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      const localSession = readLocalAuthSession();
      setUser(localSession ? createMockUser(localSession) : null);
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured || !supabase) {
      const localAccount = readLocalAuthAccount();

      if (!localAccount || localAccount.email !== email || localAccount.password !== password) {
        throw new Error('Invalid login credentials');
      }

      const localSession = {
        id: localAccount.id,
        email: localAccount.email,
        createdAt: localAccount.createdAt,
      };

      window.localStorage.setItem(LOCAL_AUTH_SESSION_KEY, JSON.stringify(localSession));
      setUser(createMockUser(localSession));
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    if (!isSupabaseConfigured || !supabase) {
      const existingAccount = readLocalAuthAccount();

      if (existingAccount?.email === email) {
        throw new Error('User already registered');
      }

      const newAccount: LocalAuthAccount = {
        id:
          typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : `local-user-${Date.now()}`,
        email,
        password,
        createdAt: new Date().toISOString(),
      };

      window.localStorage.setItem(LOCAL_AUTH_ACCOUNT_KEY, JSON.stringify(newAccount));
      return;
    }

    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    if (!isSupabaseConfigured || !supabase) {
      window.localStorage.removeItem(LOCAL_AUTH_SESSION_KEY);
      setUser(null);
      return;
    }

    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
