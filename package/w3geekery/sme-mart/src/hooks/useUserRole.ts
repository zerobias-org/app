'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useZeroBias } from '@/context/ZeroBiasContext';

const AUTH_MODE = process.env.NEXT_PUBLIC_AUTH_MODE || 'proxy';
const DEBOUNCE_MS = 1000;

const PKV_KEY = 'sme-mart.user-role';
const LOCAL_STORAGE_KEY = 'sme-mart-user-role';

export type UserRole = 'buyer' | 'provider' | 'both';

const DEFAULT_ROLE: UserRole = 'both';

export function useUserRole() {
  const { service } = useZeroBias();
  const [role, setRoleState] = useState<UserRole>(DEFAULT_ROLE);
  const [loading, setLoading] = useState(true);

  const hasLoaded = useRef(false);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load from PKV or localStorage
  useEffect(() => {
    if (hasLoaded.current) return;

    const load = async () => {
      setLoading(true);
      try {
        if (AUTH_MODE === 'mock') {
          const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (['buyer', 'provider', 'both'].includes(parsed)) {
              setRoleState(parsed as UserRole);
            }
          }
        } else if (service) {
          try {
            const pkv = service.zerobiasClientApi.danaClient.getPkvApi();
            const response = await pkv.getPrincipalKeyValue(PKV_KEY);
            if (response?.value) {
              const stored = response.value as { role?: string };
              if (stored.role && ['buyer', 'provider', 'both'].includes(stored.role)) {
                setRoleState(stored.role as UserRole);
              }
            }
          } catch (err: unknown) {
            const e = err as { response?: { status?: number } };
            if (e?.response?.status !== 404) {
              console.warn('Failed to load user role from PKV:', err);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load user role:', err);
      } finally {
        setLoading(false);
        hasLoaded.current = true;
      }
    };

    if (AUTH_MODE === 'mock' || service) {
      load();
    }
  }, [service]);

  // Debounced save
  const save = useCallback(
    async (newRole: UserRole) => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      saveTimerRef.current = setTimeout(async () => {
        try {
          if (AUTH_MODE === 'mock') {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newRole));
          } else if (service) {
            const pkv = service.zerobiasClientApi.danaClient.getPkvApi();
            await pkv.upsertPrincipalKeyValue({
              key: PKV_KEY,
              value: { role: newRole } as unknown as { [key: string]: object },
            });
          }
        } catch (err) {
          console.error('Failed to save user role:', err);
        }
      }, DEBOUNCE_MS);
    },
    [service]
  );

  const setRole = useCallback(
    (newRole: UserRole) => {
      setRoleState(newRole);
      save(newRole);
    },
    [save]
  );

  return { role, setRole, loading };
}

export default useUserRole;
