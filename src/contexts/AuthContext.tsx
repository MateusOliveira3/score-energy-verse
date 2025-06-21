import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@/lib/data-layer';

const API_BASE_URL = 'http://localhost:3001/api';
const CURRENT_USER_KEY = 'currentUser';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Funções de autenticação
const signInUser = async (email: string, password: string): Promise<User> => {
  const response = await fetch(`${API_BASE_URL}/auth/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Falha no login');
  }

  const user: User = await response.json();
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  return user;
};

const signUpUser = async (email: string, password: string): Promise<User> => {
  const response = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Falha ao registrar');
  }

  const newUser: User = await response.json();
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
  return newUser;
};

const getCurrentUser = async (): Promise<User | null> => {
  const userJson = localStorage.getItem(CURRENT_USER_KEY);
  return userJson ? JSON.parse(userJson) : null;
};

const signOutUser = async (): Promise<void> => {
  localStorage.removeItem(CURRENT_USER_KEY);
};

const resetPasswordUser = async (email: string): Promise<void> => {
  // Implementar chamada de API para /auth/reset-password se necessário
  console.warn('Função de reset de senha ainda não implementada no backend.');
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar sessão atual
    const checkSession = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Erro ao verificar sessão:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const user = await signInUser(email, password);
      setUser(user);
    } catch (error: any) {
      if (error.message.includes('Email não confirmado')) {
        throw new Error('Email não confirmado. Por favor, verifique sua caixa de entrada.');
      }
      if (error.message.includes('Email ou senha inválidos')) {
        throw new Error('Email ou senha inválidos.');
      }
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const user = await signUpUser(email, password);
      setUser(user);
    } catch (error: any) {
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await signOutUser();
      setUser(null);
    } catch (error: any) {
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await resetPasswordUser(email);
    } catch (error: any) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, resetPassword }}>
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