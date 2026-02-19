import type { UserRole } from './enums';

/** Which filter categories are enabled/visible in the filter panel */
export interface EnabledFilters {
  roles: boolean;
  skills: boolean;
  products: boolean;
  frameworks: boolean;
  segments: boolean;
  serviceSegments: boolean;
}

/** Active filter selections per catalog type */
export interface CatalogFiltersState {
  roles: string[];       // selected role IDs
  skills: string[];      // selected skill IDs
  products: string[];    // selected product IDs
  frameworks: string[];  // selected framework IDs
  segments: string[];    // selected segment IDs
  serviceSegments: string[]; // selected service segment IDs
}

export type FilterType = keyof EnabledFilters;

export const DEFAULT_ENABLED_FILTERS: EnabledFilters = {
  roles: true,
  skills: true,
  products: false,
  frameworks: false,
  segments: false,
  serviceSegments: false,
};

export const DEFAULT_CATALOG_FILTERS: CatalogFiltersState = {
  roles: [],
  skills: [],
  products: [],
  frameworks: [],
  segments: [],
  serviceSegments: [],
};

/** Shape persisted to PKV */
export interface UserPreferencesData {
  userRole?: UserRole;
  enabledFilters?: EnabledFilters;
  catalogFilters?: CatalogFiltersState;
}
