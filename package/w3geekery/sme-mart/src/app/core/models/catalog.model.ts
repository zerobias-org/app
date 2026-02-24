/**
 * ZeroBias catalog types — mapped from SDK responses.
 * Used by CatalogService for caching and by autocomplete components for search.
 */

/** Generic item shape used by CatalogFilterSection */
export interface CatalogItem {
  id: string;
  name: string;
  code?: string;
  description?: string;
}

export interface CatalogRole {
  id: string;
  name: string;
  code: string;
  description?: string;
  categoryId?: string;
  categoryName?: string;
}

export interface CatalogRoleCategory {
  id: string;
  name: string;
  code: string;
  description?: string;
}

export interface CatalogSkill {
  id: string;
  name: string;
  code: string; // S#### format
  description?: string;
  qualificationType?: string;
}

export interface CatalogFramework {
  id: string;
  name: string;
  code?: string;
  description?: string;
  elementCount?: number;
}

export interface CatalogSegment {
  id: string;
  name: string;
  code: string;
  description?: string;
}

/**
 * Service Segment from ZeroBias tags API (service-segment type).
 * Used for SME Mart professional service categories.
 */
export interface ServiceSegment {
  id: string;
  name: string;
  type: string; // "service-segment"
  description?: string;
}

export interface CatalogProduct {
  id: string;
  name: string;
  code?: string;
  description?: string;
  vendorName?: string;
}
