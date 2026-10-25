import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { authApi } from '../api';
import { accountsStore } from '../services/accountsStore';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: { login: string; password: string }) => Promise<User>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  setSession: (token: string, user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const CURRENT_USER_STORAGE_KEY = 'aquatrack_current_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as User;
        const fresh = parsed.email
          ? accountsStore.getUserByEmail(parsed.email)
          : accountsStore.getUserById(parsed.id);
        if (fresh && fresh.role === parsed.role) {
          return { ...fresh, ...parsed };
        }
        return parsed;
      }
    } catch {
      // ignore
    }
    return null;
  });
  const [token, setToken] = useState<string | null>(localStorage.getItem('aquatrack_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const setUser = (nextUser: User | null) => {
    setUserState(nextUser);
    try {
      if (nextUser) {
        localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(nextUser));
      } else {
        localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('aquatrack_token');
      if (storedToken) {
        try {
          const currentUser = await authApi.me();
          const storedAccount = currentUser.email
            ? accountsStore.getUserByEmail(currentUser.email)
            : accountsStore.getUserById(currentUser.id);
          if (
            storedAccount &&
            storedAccount.role === currentUser.role &&
            (!currentUser.email || storedAccount.email?.toLowerCase().trim() === currentUser.email.toLowerCase().trim())
          ) {
            setUser({ ...storedAccount, ...currentUser });
          } else {
            setUser(currentUser);
          }
        } catch {
          // If local user exists in localStorage from demo/offline session, keep it if active
          try {
            const saved = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
            if (saved) {
              const parsed = JSON.parse(saved) as User;
              const fresh = (parsed.email ? accountsStore.getUserByEmail(parsed.email) : accountsStore.getUserById(parsed.id)) || parsed;
              if (fresh.status === 'active' && fresh.role === parsed.role) {
                setUser({ ...fresh, ...parsed });
                setIsLoading(false);
                return;
              }
            }
          } catch {
            // ignore
          }
          localStorage.removeItem('aquatrack_token');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (credentials: { login: string; password: string }): Promise<User> => {
    // 1. Attempt live backend authentication first (authoritative)
    try {
      const data = await authApi.login(credentials);
      localStorage.setItem('aquatrack_token', data.token);
      setToken(data.token);
      // Synchronize verified/active status to accountsStore for customers so local state is in sync
      if (data.user?.role === 'customer' && data.user?.status === 'active') {
        const existing = data.user.email ? accountsStore.getUserByEmail(data.user.email) : accountsStore.getUserById(data.user.id);
        if (!existing || existing.status !== 'active' || !existing.is_verified) {
          accountsStore.verifyCustomer(data.user.email || data.user.id);
        }
      }
      setUser(data.user);
      return data.user;
    } catch (apiErr: any) {
      // If server responded with an error (e.g. 403 pending/declined/inactive, or 422/401 invalid credentials):
      if (apiErr?.response) {
        throw apiErr;
      }

      // 2. Only if backend is offline / unreachable, fall back to accountsStore
      const localAuth = accountsStore.authenticateLogin(credentials.login, credentials.password);
      if (localAuth.success && localAuth.user) {
        const mockToken = `local-token-${localAuth.user.id}-${Date.now()}`;
        localStorage.setItem('aquatrack_token', mockToken);
        setToken(mockToken);
        setUser(localAuth.user);
        return localAuth.user;
      }
      if (localAuth.error) {
        throw {
          response: {
            data: {
              message: localAuth.error,
              status_type: localAuth.statusType,
            },
          },
        };
      }
      throw apiErr;
    }
  };

  const setSession = (newToken: string, newUser: User) => {
    localStorage.setItem('aquatrack_token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('aquatrack_token');
      localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
      setToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, setUser, setSession }}>
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
