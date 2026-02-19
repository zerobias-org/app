import { Injectable, inject, signal, computed } from '@angular/core';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import { Pkv } from '@zerobias-com/dana-sdk';
import type { UserRole } from '../models';
import {
  DEFAULT_ENABLED_FILTERS,
  DEFAULT_CATALOG_FILTERS,
  type EnabledFilters,
  type CatalogFiltersState,
  type FilterType,
} from '../models';

const ROLE_KEY = 'sme-mart.user-role';
const FILTERS_KEY = 'sme-mart.catalog-filters';
const SAVE_DEBOUNCE_MS = 500;

/**
 * PKV-backed user preferences: role toggle (buyer/provider/both)
 * and catalog filter state. Falls back to localStorage when PKV
 * is unavailable (e.g., before auth).
 */
@Injectable({ providedIn: 'root' })
export class UserPreferencesService {
  private readonly clientApi = inject(ZerobiasClientApi);

  readonly userRole = signal<UserRole>('both');
  readonly enabledFilters = signal<EnabledFilters>({ ...DEFAULT_ENABLED_FILTERS });
  readonly catalogFilters = signal<CatalogFiltersState>({ ...DEFAULT_CATALOG_FILTERS });
  readonly loading = signal(true);

  readonly activeFilterCount = computed(() => {
    const filters = this.catalogFilters();
    return Object.values(filters).reduce((sum, arr) => sum + arr.length, 0);
  });

  private saveTimers = new Map<string, ReturnType<typeof setTimeout>>();

  // ---------------------------------------------------------------------------
  // Load
  // ---------------------------------------------------------------------------

  async loadPreferences(): Promise<void> {
    this.loading.set(true);
    try {
      await Promise.all([
        this.loadPkv(ROLE_KEY, (val) => {
          if (val?.role) this.userRole.set(val.role as UserRole);
        }),
        this.loadPkv(FILTERS_KEY, (val) => {
          if (val?.enabledFilters) this.enabledFilters.set(val.enabledFilters as EnabledFilters);
          if (val?.catalogFilters) this.catalogFilters.set(val.catalogFilters as CatalogFiltersState);
        }),
      ]);
      console.log(`[Preferences] Loaded — role: ${this.userRole()}, active filters: ${this.activeFilterCount()}`);
    } catch (err) {
      console.warn('[Preferences] Load error (using defaults):', err);
    } finally {
      this.loading.set(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Role
  // ---------------------------------------------------------------------------

  setUserRole(role: UserRole): void {
    this.userRole.set(role);
    this.debouncedSave(ROLE_KEY, { role });
  }

  // ---------------------------------------------------------------------------
  // Filters
  // ---------------------------------------------------------------------------

  setEnabledFilters(filters: EnabledFilters): void {
    this.enabledFilters.set(filters);
    this.saveFilterState();
  }

  toggleFilterType(filterType: FilterType): void {
    const current = this.enabledFilters();
    this.enabledFilters.set({ ...current, [filterType]: !current[filterType] });
    this.saveFilterState();
  }

  setCatalogFilters(filters: CatalogFiltersState): void {
    this.catalogFilters.set(filters);
    this.saveFilterState();
  }

  clearAllFilters(): void {
    this.catalogFilters.set({ ...DEFAULT_CATALOG_FILTERS });
    this.saveFilterState();
  }

  removeFilterSelection(filterType: FilterType, itemId: string): void {
    const current = this.catalogFilters();
    this.catalogFilters.set({
      ...current,
      [filterType]: current[filterType].filter((id: string) => id !== itemId),
    });
    this.saveFilterState();
  }

  // ---------------------------------------------------------------------------
  // Internals
  // ---------------------------------------------------------------------------

  private saveFilterState(): void {
    this.debouncedSave(FILTERS_KEY, {
      enabledFilters: this.enabledFilters(),
      catalogFilters: this.catalogFilters(),
    });
  }

  private async loadPkv(key: string, apply: (val: any) => void): Promise<void> {
    try {
      const pkv = await this.clientApi.danaClient.getPkvApi().getPrincipalKeyValue(key);
      if (pkv?.value) {
        apply(pkv.value);
      }
    } catch {
      // PKV not found — use defaults (first time user)
    }
  }

  private debouncedSave(key: string, value: Record<string, unknown>): void {
    const existing = this.saveTimers.get(key);
    if (existing) clearTimeout(existing);

    this.saveTimers.set(
      key,
      setTimeout(async () => {
        this.saveTimers.delete(key);
        try {
          const pkv = new Pkv(key, value as { [k: string]: object });
          await this.clientApi.danaClient.getPkvApi().upsertPrincipalKeyValue(pkv);
        } catch (err) {
          console.warn(`[Preferences] Failed to save ${key}:`, err);
        }
      }, SAVE_DEBOUNCE_MS),
    );
  }
}
