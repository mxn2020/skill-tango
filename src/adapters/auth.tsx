// ═══════════════════════════════════════════════════
// Skill-Tango — Auth Adapter
// Mock authentication, swap-ready for BetterAuth/Convex
// ═══════════════════════════════════════════════════

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';
import type { User } from '../types';
import { logger } from './logger';

interface AuthAdapter {
  getCurrentUser(): Promise<User | null>;
  login(email: string, password: string): Promise<User>;
  logout(): Promise<void>;
  isAuthenticated(): Promise<boolean>;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

const STORAGE_KEY = 'skill-tango-auth';

const MOCK_USER: User = {
  id: 'user_001',
  email: 'alex@skill-tango.app',
  name: 'Alex Chen',
  avatar: '',
  plan: 'pro',
  role: 'Owner',
  preferences: {
    coachingStyle: 'balanced',
    dailyGoalMinutes: 30,
    enableSounds: true,
    theme: 'dark',
    learningGoal: 'daily',
    interests: ['programming', 'languages', 'design'],
  },
  createdAt: '2026-02-01T08:00:00Z',
  xp: 1450,
  level: 8,
};

const authAdapter: AuthAdapter = {
  async getCurrentUser(): Promise<User | null> {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as User;
      }
      return null;
    } catch {
      logger.error('AuthAdapter', 'Failed to get current user');
      return null;
    }
  },

  async login(email: string, _password: string): Promise<User> {
    await new Promise((r) => setTimeout(r, 800));
    if (email === 'alex@skill-tango.app' || email === 'alex') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_USER));
      logger.info('AuthAdapter', 'User logged in', { email });
      return MOCK_USER;
    }
    // Accept any email for demo
    const user = { ...MOCK_USER, email, name: email.split('@')[0] };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    logger.info('AuthAdapter', 'User logged in', { email });
    return user;
  },

  async logout(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY);
    logger.info('AuthAdapter', 'User logged out');
  },

  async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user !== null;
  },
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authAdapter.getCurrentUser().then((u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const u = await authAdapter.login(email, password);
      setUser(u);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await authAdapter.logout();
    setUser(null);
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export { authAdapter };
