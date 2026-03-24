import { Injectable, inject, signal, computed } from '@angular/core';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import { ZbThemeService } from '@zerobias-org/ngx-library';
import { Pkv } from '@zerobias-com/dana-sdk';
import type { UserRole } from '../models';
import {
  DEFAULT_ENABLED_FILTERS,
  DEFAULT_CATALOG_FILTERS,
  DEFAULT_TIMELINE_ENABLED_FILTERS,
  type EnabledFilters,
  type CatalogFiltersState,
  type FilterType,
  type TimelineEnabledFilters,
} from '../models';

const ROLE_KEY = 'sme-mart.user-role';
const FILTERS_KEY = 'sme-mart.catalog-filters';
const TIMELINE_FILTERS_KEY = 'sme-mart.timeline-filters';
const THEME_KEY = 'sme-mart.theme-preference';
const FOLDER_COLORS_KEY = 'sme-mart.folder-colors';
const SAVE_DEBOUNCE_MS = 500;

/** Personal folder color map: folderId → hex color */
export type FolderColorMap = Record<string, string>;

type ThemePreference = 'light' | 'dark' | 'system';

/**
 * PKV-backed user preferences: role toggle (buyer/provider/both)
 * and catalog filter state. Falls back to localStorage when PKV
 * is unavailable (e.g., before auth).
 */
@Injectable({ providedIn: 'root' })
export class UserPreferencesService {
  private readonly clientApi = inject(ZerobiasClientApi);
  private readonly themeService = inject(ZbThemeService);

  readonly userRole = signal<UserRole>('both');
  readonly themePreference = signal<ThemePreference>(
    (localStorage.getItem('zb-theme-preference') as ThemePreference) || 'system',
  );
  readonly enabledFilters = signal<EnabledFilters>({ ...DEFAULT_ENABLED_FILTERS });
  readonly catalogFilters = signal<CatalogFiltersState>({ ...DEFAULT_CATALOG_FILTERS });
  readonly timelineEnabledFilters = signal<TimelineEnabledFilters>({ ...DEFAULT_TIMELINE_ENABLED_FILTERS });
  readonly folderColors = signal<FolderColorMap>({});
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
        this.loadPkv(THEME_KEY, (val) => {
          if (val?.theme) {
            const pref = val.theme as ThemePreference;
            this.themePreference.set(pref);
            this.themeService.setPreference(pref);
          }
        }),
        this.loadPkv(TIMELINE_FILTERS_KEY, (val) => {
          if (val?.enabledFilters) this.timelineEnabledFilters.set(val.enabledFilters as TimelineEnabledFilters);
        }),
        this.loadPkv(FOLDER_COLORS_KEY, (val) => {
          if (val?.colors) this.folderColors.set(val.colors as FolderColorMap);
        }),
      ]);
      console.log(`[Preferences] Loaded — role: ${this.userRole()}, theme: ${this.themePreference()}, active filters: ${this.activeFilterCount()}`);
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
  // Theme
  // ---------------------------------------------------------------------------

  setThemePreference(pref: ThemePreference): void {
    this.themePreference.set(pref);
    this.themeService.setPreference(pref);
    this.debouncedSave(THEME_KEY, { theme: pref });
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
  // Timeline Filters (persists enabled sections only — selections are per-engagement)
  // ---------------------------------------------------------------------------

  setTimelineEnabledFilters(filters: TimelineEnabledFilters): void {
    this.timelineEnabledFilters.set(filters);
    this.debouncedSave(TIMELINE_FILTERS_KEY, { enabledFilters: filters });
  }

  // ---------------------------------------------------------------------------
  // Folder Colors (personal)
  // ---------------------------------------------------------------------------

  setFolderColor(folderId: string, color: string): void {
    this.folderColors.set({ ...this.folderColors(), [folderId]: color });
    this.debouncedSave(FOLDER_COLORS_KEY, { colors: this.folderColors() });
  }

  removeFolderColor(folderId: string): void {
    const { [folderId]: _, ...rest } = this.folderColors();
    this.folderColors.set(rest);
    this.debouncedSave(FOLDER_COLORS_KEY, { colors: rest });
  }

  getFolderColor(folderId: string): string | null {
    return this.folderColors()[folderId] ?? null;
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
    // Try PKV first, fall back to localStorage
    try {
      const pkv = await this.clientApi.danaClient.getPkvApi().getPrincipalKeyValue(key);
      if (pkv?.value) {
        apply(pkv.value);
        return;
      }
    } catch {
      // PKV unavailable — fall through to localStorage
    }

    // localStorage fallback
    try {
      const raw = localStorage.getItem(key);
      if (raw) apply(JSON.parse(raw));
    } catch { /* corrupt data — use defaults */ }
  }

  private debouncedSave(key: string, value: Record<string, unknown>): void {
    const existing = this.saveTimers.get(key);
    if (existing) clearTimeout(existing);

    // Always save to localStorage immediately (synchronous, reliable)
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch { /* quota exceeded */ }

    // Attempt PKV save in background (may fail if API is down)
    this.saveTimers.set(
      key,
      setTimeout(async () => {
        this.saveTimers.delete(key);
        try {
          const pkv = new Pkv(key, value as { [k: string]: object });
          await this.clientApi.danaClient.getPkvApi().upsertPrincipalKeyValue(pkv);
        } catch {
          // PKV save failed — localStorage has the data, no need to warn
        }
      }, SAVE_DEBOUNCE_MS),
    );
  }
}
