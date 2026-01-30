'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import ZerobiasAppService from '@/lib/zerobias';

// Auth modes: 'mock' for local testing, 'proxy' for proxied auth, 'production' for deployed
type AuthMode = 'mock' | 'proxy' | 'production';
const AUTH_MODE = (process.env.NEXT_PUBLIC_AUTH_MODE as AuthMode) || 'proxy';

// Mock data for local development
const MOCK_USER = {
  id: 'mock-user-001',
  email: 'developer@example.com',
  firstName: 'Local',
  lastName: 'Developer',
  displayName: 'Local Developer',
  roles: ['admin', 'user'],
};

const MOCK_ORG = {
  id: 'mock-org-001',
  name: 'dev-org',
  displayName: 'Development Organization',
};

const MOCK_ORGS = [
  MOCK_ORG,
  { id: 'mock-org-002', name: 'test-org', displayName: 'Test Organization' },
];

// Types from the SDK
interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  roles?: string[];
}

interface Org {
  id: string;
  name: string;
  displayName?: string;
}

interface ZeroBiasContextType {
  // Auth state
  user: User | null;
  org: Org | null;
  orgs: Org[];
  loading: boolean;
  error: Error | null;
  isAdmin: boolean;

  // Service instance
  service: ZerobiasAppService | null;

  // Impersonation (dev only)
  isImpersonating: boolean;
  impersonateUser: (userId: string, displayName: string, email?: string) => void;
  stopImpersonating: () => void;

  // Actions
  refreshUser: () => Promise<void>;
  selectOrg: (orgId: string) => Promise<void>;
}

const ZeroBiasContext = createContext<ZeroBiasContextType | undefined>(undefined);

interface ZeroBiasProviderProps {
  children: ReactNode;
}

export function ZeroBiasProvider({ children }: ZeroBiasProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [org, setOrg] = useState<Org | null>(null);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [service, setService] = useState<ZerobiasAppService | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [realUser, setRealUser] = useState<User | null>(null);

  // Initialize service and fetch user
  useEffect(() => {
    const initMockMode = () => {
      console.log('🔧 ZeroBias running in MOCK mode for local development');
      setUser(MOCK_USER);
      setOrg(MOCK_ORG);
      setOrgs(MOCK_ORGS);
      setIsAdmin(true);
      setLoading(false);
    };

    const initRealMode = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get singleton instance (initializes on first call)
        const appService = await ZerobiasAppService.getInstance();
        setService(appService);

        // Get current user (cast to any to access user-specific fields)
        const userData = await appService.zerobiasClientApp.whoAmI() as any;
        const userRoles = userData.roles || [];
        const email = userData.emails?.[0] || userData.email || '';
        setUser({
          id: String(userData.id),
          email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          displayName: userData.name || userData.displayName || email,
          roles: userRoles,
        });

        // Check if user is a ZeroBias admin
        // TODO: Replace with actual admin role check from ZeroBias
        // For now, check for 'admin' role or zerobias.com email domain
        const adminCheck = userRoles.includes('admin') ||
          userRoles.includes('zerobias_admin') ||
          (userData.email && userData.email.endsWith('@zerobias.com'));
        setIsAdmin(adminCheck);

        // Subscribe to orgs
        appService.zerobiasClientApp.getOrgs().subscribe({
          next: (orgsList: any[]) => {
            setOrgs(orgsList.map((o) => ({
              id: String(o.id),
              name: o.name,
              displayName: o.displayName,
            })));
          },
          error: (err: Error) => console.error('Failed to get orgs:', err),
        });

        // Subscribe to current org
        appService.zerobiasClientApp.getCurrentOrg().subscribe({
          next: (currentOrg: any) => {
            if (currentOrg) {
              setOrg({
                id: String(currentOrg.id),
                name: currentOrg.name,
                displayName: currentOrg.displayName,
              });
            }
          },
          error: (err: Error) => console.error('Failed to get current org:', err),
        });

      } catch (err) {
        console.error('Failed to initialize ZeroBias:', err);
        setError(err instanceof Error ? err : new Error('Failed to initialize'));
      } finally {
        setLoading(false);
      }
    };

    if (AUTH_MODE === 'mock') {
      initMockMode();
    } else {
      initRealMode();
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (!service) return;

    try {
      const userData = await service.zerobiasClientApp.whoAmI() as any;
      setUser({
        id: String(userData.id),
        email: userData.email || '',
        firstName: userData.firstName,
        lastName: userData.lastName,
        displayName: userData.displayName || userData.email,
      });
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  }, [service]);

  const selectOrg = useCallback(async (orgId: string) => {
    if (!service) return;

    const selectedOrg = orgs.find(o => o.id === orgId);
    if (selectedOrg) {
      // Use the service's selectOrg method
      const fullOrg = { id: selectedOrg.id, name: selectedOrg.name };
      await service.zerobiasClientApp.selectOrg(fullOrg as any);
    }
  }, [service, orgs]);

  const impersonateUser = useCallback((userId: string, displayName: string, email?: string) => {
    if (!isImpersonating && user) {
      setRealUser(user);
    }
    setUser({
      id: userId,
      email: email || `${userId}@demo.smemart.com`,
      displayName,
    });
    setIsImpersonating(true);
  }, [user, isImpersonating]);

  const stopImpersonating = useCallback(() => {
    if (realUser) {
      setUser(realUser);
      setRealUser(null);
    }
    setIsImpersonating(false);
  }, [realUser]);

  const value: ZeroBiasContextType = {
    user,
    org,
    orgs,
    loading,
    error,
    isAdmin,
    service,
    isImpersonating,
    impersonateUser,
    stopImpersonating,
    refreshUser,
    selectOrg,
  };

  return (
    <ZeroBiasContext.Provider value={value}>
      {children}
    </ZeroBiasContext.Provider>
  );
}

export function useZeroBias() {
  const context = useContext(ZeroBiasContext);
  if (context === undefined) {
    throw new Error('useZeroBias must be used within a ZeroBiasProvider');
  }
  return context;
}

// Convenience hooks
export function useUser() {
  const { user, loading, error, refreshUser } = useZeroBias();
  return { user, loading, error, refreshUser };
}

export function useOrg() {
  const { org, orgs, selectOrg } = useZeroBias();
  return { org, orgs, selectOrg };
}

export function useZeroBiasService() {
  const { service } = useZeroBias();
  return service;
}
