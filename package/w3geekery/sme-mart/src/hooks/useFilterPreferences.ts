'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useZeroBias } from '@/context/ZeroBiasContext';
import { type EnabledFilters, type FilterType } from '@/components/marketplace/FilterEnabler';
import { type ProviderFiltersState } from '@/components/marketplace/ProviderFilters';

// Auth mode from environment
const AUTH_MODE = process.env.NEXT_PUBLIC_AUTH_MODE || 'proxy';
const PKV_KEY = 'sme-mart.provider-filters';
const LOCAL_STORAGE_KEY = 'sme-mart-provider-filters';
const DEBOUNCE_MS = 1000;

// Combined preferences shape stored in PKV
export interface FilterPreferences {
  enabledFilters: EnabledFilters;
  catalogFilters: ProviderFiltersState;
}

const initialEnabledFilters: EnabledFilters = {
  serviceCategories: false,
  frameworks: false,
  products: false,
  skills: false,
  roles: false,
  segments: false,
};

const emptyCategory = { selected: [], disabled: [] };

const initialCatalogFilters: ProviderFiltersState = {
  frameworks: { ...emptyCategory },
  products: { ...emptyCategory },
  skills: { ...emptyCategory },
  roles: { ...emptyCategory },
  segments: { ...emptyCategory },
  serviceSegments: { ...emptyCategory },
};

// Migrate old format (string[]) to new format (FilterCategoryState)
function migrateFiltersIfNeeded(filters: unknown): ProviderFiltersState {
  if (!filters || typeof filters !== 'object') {
    return initialCatalogFilters;
  }
  const f = filters as Record<string, unknown>;

  // Check if it's already in new format (has objects with selected/disabled)
  if (f.frameworks && typeof f.frameworks === 'object' && 'selected' in (f.frameworks as object)) {
    return filters as ProviderFiltersState;
  }

  // Migrate from old format (string arrays) to new format
  const migrateCategory = (value: unknown) => {
    if (Array.isArray(value)) {
      return { selected: value as string[], disabled: [] };
    }
    return { ...emptyCategory };
  };

  return {
    frameworks: migrateCategory(f.frameworks),
    products: migrateCategory(f.products),
    skills: migrateCategory(f.skills),
    roles: migrateCategory(f.roles),
    segments: migrateCategory(f.segments),
    serviceSegments: migrateCategory(f.serviceSegments),
  };
}

const initialPreferences: FilterPreferences = {
  enabledFilters: initialEnabledFilters,
  catalogFilters: initialCatalogFilters,
};

export function useFilterPreferences() {
  const { service } = useZeroBias();
  const [preferences, setPreferences] = useState<FilterPreferences>(initialPreferences);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Ref to track if we've loaded initial preferences
  const hasLoaded = useRef(false);
  // Ref for debounce timer
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load preferences from PKV or localStorage
  useEffect(() => {
    if (hasLoaded.current) return;

    const loadPreferences = async () => {
      setLoading(true);
      setError(null);

      try {
        if (AUTH_MODE === 'mock') {
          // Mock mode: use localStorage
          const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (stored) {
            const parsed = JSON.parse(stored);
            // Migrate old format if needed
            const migratedFilters = migrateFiltersIfNeeded(parsed.catalogFilters);
            setPreferences({
              enabledFilters: parsed.enabledFilters || initialEnabledFilters,
              catalogFilters: migratedFilters,
            });
          }
        } else if (service) {
          // Real mode: use PKV API
          try {
            const pkv = service.zerobiasClientApi.danaClient.getPkvApi();
            const response = await pkv.getPrincipalKeyValue(PKV_KEY);
            if (response?.value) {
              const stored = response.value as Record<string, unknown>;
              // Migrate old format if needed
              const migratedFilters = migrateFiltersIfNeeded(stored.catalogFilters);
              setPreferences({
                enabledFilters: (stored.enabledFilters as EnabledFilters) || initialEnabledFilters,
                catalogFilters: migratedFilters,
              });
            }
          } catch (err: unknown) {
            // PKV not found is OK - user hasn't saved preferences yet
            const e = err as { response?: { status?: number } };
            if (e?.response?.status !== 404) {
              console.warn('Failed to load filter preferences from PKV:', err);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load filter preferences:', err);
        setError(err instanceof Error ? err : new Error('Failed to load preferences'));
      } finally {
        setLoading(false);
        hasLoaded.current = true;
      }
    };

    // In real mode, wait for service to be available
    if (AUTH_MODE === 'mock' || service) {
      loadPreferences();
    }
  }, [service]);

  // Save preferences (debounced)
  const savePreferences = useCallback(
    async (newPreferences: FilterPreferences) => {
      // Clear any pending save
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      // Debounce the save
      saveTimerRef.current = setTimeout(async () => {
        try {
          if (AUTH_MODE === 'mock') {
            // Mock mode: save to localStorage
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newPreferences));
          } else if (service) {
            // Real mode: save to PKV
            const pkv = service.zerobiasClientApi.danaClient.getPkvApi();
            await pkv.upsertPrincipalKeyValue({
              key: PKV_KEY,
              value: newPreferences as unknown as { [key: string]: object },
            });
          }
        } catch (err) {
          console.error('Failed to save filter preferences:', err);
        }
      }, DEBOUNCE_MS);
    },
    [service]
  );

  // Update enabled filters
  const setEnabledFilters = useCallback(
    (enabledFilters: EnabledFilters) => {
      const newPrefs = { ...preferences, enabledFilters };
      setPreferences(newPrefs);
      savePreferences(newPrefs);
    },
    [preferences, savePreferences]
  );

  // Update catalog filters
  const setCatalogFilters = useCallback(
    (catalogFilters: ProviderFiltersState) => {
      const newPrefs = { ...preferences, catalogFilters };
      setPreferences(newPrefs);
      savePreferences(newPrefs);
    },
    [preferences, savePreferences]
  );

  // Toggle a single filter type
  const toggleFilter = useCallback(
    (filterType: FilterType) => {
      const newEnabledFilters = {
        ...preferences.enabledFilters,
        [filterType]: !preferences.enabledFilters[filterType],
      };
      const newPrefs = { ...preferences, enabledFilters: newEnabledFilters };
      setPreferences(newPrefs);
      savePreferences(newPrefs);
    },
    [preferences, savePreferences]
  );

  // Remove a filter (disable section and clear selections)
  const removeFilter = useCallback(
    (filterType: FilterType) => {
      const filterKeyMap: Record<FilterType, keyof ProviderFiltersState> = {
        serviceCategories: 'serviceSegments',
        frameworks: 'frameworks',
        products: 'products',
        skills: 'skills',
        roles: 'roles',
        segments: 'segments',
      };

      const filterKey = filterKeyMap[filterType];
      const newPrefs: FilterPreferences = {
        enabledFilters: {
          ...preferences.enabledFilters,
          [filterType]: false,
        },
        catalogFilters: {
          ...preferences.catalogFilters,
          [filterKey]: { selected: [], disabled: [] },
        },
      };
      setPreferences(newPrefs);
      savePreferences(newPrefs);
    },
    [preferences, savePreferences]
  );

  // Clear all filters and enabled sections
  const clearAll = useCallback(() => {
    setPreferences(initialPreferences);
    savePreferences(initialPreferences);
  }, [savePreferences]);

  // Helper to count active (non-disabled) items in a category
  const getActiveCount = (category: { selected: string[]; disabled: string[] }) =>
    category.selected.filter(id => !category.disabled.includes(id)).length;

  // Count active catalog filter selections (excludes disabled items)
  const activeFilterCount =
    getActiveCount(preferences.catalogFilters.frameworks) +
    getActiveCount(preferences.catalogFilters.products) +
    getActiveCount(preferences.catalogFilters.skills) +
    getActiveCount(preferences.catalogFilters.roles) +
    getActiveCount(preferences.catalogFilters.segments) +
    getActiveCount(preferences.catalogFilters.serviceSegments);

  // Count total selected items (including disabled)
  const totalSelectedCount =
    preferences.catalogFilters.frameworks.selected.length +
    preferences.catalogFilters.products.selected.length +
    preferences.catalogFilters.skills.selected.length +
    preferences.catalogFilters.roles.selected.length +
    preferences.catalogFilters.segments.selected.length +
    preferences.catalogFilters.serviceSegments.selected.length;

  return {
    // State
    enabledFilters: preferences.enabledFilters,
    catalogFilters: preferences.catalogFilters,
    loading,
    error,
    activeFilterCount,      // Only active (non-disabled) filters
    totalSelectedCount,     // All selected items (including disabled)

    // Actions
    setEnabledFilters,
    setCatalogFilters,
    toggleFilter,
    removeFilter,
    clearAll,
  };
}

export default useFilterPreferences;
