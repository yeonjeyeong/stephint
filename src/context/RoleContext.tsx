'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { AppRole, AuthSession, SessionUser } from '@/lib/auth/types';

interface RoleContextType {
  user: SessionUser | null;
  role: AppRole | null;
  loading: boolean;
  login: (session: AuthSession) => void;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const RoleContext = createContext<RoleContextType>({
  user: null,
  role: null,
  loading: false,
  login: () => {},
  logout: async () => {},
  refresh: async () => {},
});

export function RoleProvider({
  children,
  initialSession,
}: {
  children: ReactNode;
  initialSession: AuthSession | null;
}) {
  const [session, setSession] = useState<AuthSession | null>(initialSession);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSession(initialSession);
  }, [initialSession]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/session', {
        cache: 'no-store',
      });
      const data = (await response.json()) as { session: AuthSession | null };
      setSession(data.session ?? null);
    } catch {
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback((nextSession: AuthSession) => {
    setSession(nextSession);
    setLoading(false);
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setSession(null);
      setLoading(false);
    }
  }, []);

  return (
    <RoleContext.Provider
      value={{
        user: session?.user ?? null,
        role: session?.user.role ?? null,
        loading,
        login,
        logout,
        refresh,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}
