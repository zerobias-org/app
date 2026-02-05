/**
 * ZeroBias Catalog Hooks
 *
 * Reusable hooks for fetching and caching ZeroBias catalog data:
 * - useRoles(): NICE Work Roles
 * - useSkills(): NICE Skills
 * - useFrameworks(): Compliance Frameworks
 * - useSegments(): Industry Segments
 * - useProducts(): Product Catalog
 *
 * All hooks use TanStack Query for caching and deduplication.
 */

import { useQuery } from '@tanstack/react-query';

// =============================================================================
// TYPES
// =============================================================================

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
  code: string;
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
 * Service Segment from ZeroBias tags API (service-segment type)
 * Used for SME Mart professional service categories
 *
 * TODO: Once ZeroBias service segments are populated in the catalog,
 * switch to CatalogSegment with isService filter instead.
 * See master plan: .claude/plans/public/000-MASTER-PLAN.md
 */
export interface ServiceSegment {
  id: string;
  name: string; // e.g., "soc", "pentesting", "compliance"
  type: string; // "service-segment"
  description?: string; // e.g., "Security Monitoring / Operations Center (SOC)"
}

export interface CatalogProduct {
  id: string;
  name: string;
  code?: string;
  description?: string;
  vendorName?: string;
  vendorCode?: string;
  suiteName?: string;
}

interface CatalogResponse<T> {
  items: T[];
  totalItems: number;
  type: string;
}

// =============================================================================
// FETCH HELPERS
// =============================================================================

async function fetchCatalog<T>(
  type: string,
  search?: string,
  pageSize: number = 1000
): Promise<CatalogResponse<T>> {
  const params = new URLSearchParams({ type, pageSize: pageSize.toString() });
  if (search) params.set('search', search);

  const response = await fetch(`/api/catalog?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${type}: ${response.statusText}`);
  }
  return response.json();
}

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Fetch NICE Work Roles (95 roles)
 * Optionally filter by search term
 */
export function useRoles(search?: string) {
  return useQuery({
    queryKey: ['catalog', 'roles', search],
    queryFn: () => fetchCatalog<CatalogRole>('roles', search),
    staleTime: 1000 * 60 * 30, // 30 minutes (catalog data rarely changes)
    gcTime: 1000 * 60 * 60, // 1 hour
  });
}

/**
 * Fetch NICE Role Categories (7 categories)
 */
export function useRoleCategories() {
  return useQuery({
    queryKey: ['catalog', 'roleCategories'],
    queryFn: () => fetchCatalog<CatalogRoleCategory>('roleCategories'),
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}

/**
 * Fetch NICE Skills (556 skills)
 * Optionally filter by search term
 */
export function useSkills(search?: string) {
  return useQuery({
    queryKey: ['catalog', 'skills', search],
    queryFn: () => fetchCatalog<CatalogSkill>('skills', search),
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
  });
}

/**
 * Fetch Compliance Frameworks (12 frameworks)
 * Small list - load all at once
 */
export function useFrameworks() {
  return useQuery({
    queryKey: ['catalog', 'frameworks'],
    queryFn: () => fetchCatalog<CatalogFramework>('frameworks'),
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}

/**
 * Fetch Industry Segments (128 segments)
 * Small-ish list - load all at once
 */
export function useSegments() {
  return useQuery({
    queryKey: ['catalog', 'segments'],
    queryFn: () => fetchCatalog<CatalogSegment>('segments'),
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
  });
}

/**
 * Fetch Service Segments (professional service categories)
 *
 * Currently uses tags API (tagTypes=service-segment) as the source.
 * Returns categories like: soc, pentesting, compliance, risk, training, etc.
 *
 * TODO: Once ZeroBias service segments are populated in the catalog,
 * switch to useSegments() with isService filter instead.
 * See master plan: .claude/plans/public/000-MASTER-PLAN.md
 */
export function useServiceSegments() {
  return useQuery({
    queryKey: ['catalog', 'serviceSegments'],
    queryFn: () => fetchCatalog<ServiceSegment>('serviceSegments'),
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}

/**
 * Fetch Products (663 products)
 * Optionally filter by search term
 */
export function useProducts(search?: string) {
  return useQuery({
    queryKey: ['catalog', 'products', search],
    queryFn: () => fetchCatalog<CatalogProduct>('products', search),
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
  });
}

// =============================================================================
// LOOKUP HELPERS
// =============================================================================

/**
 * Get a single role by ID from cached data
 */
export function useRoleLookup() {
  const { data } = useRoles();
  return (roleId: string): CatalogRole | undefined => {
    return data?.items.find(r => r.id === roleId || r.code === roleId);
  };
}

/**
 * Get a single skill by ID from cached data
 */
export function useSkillLookup() {
  const { data } = useSkills();
  return (skillId: string): CatalogSkill | undefined => {
    return data?.items.find(s => s.id === skillId || s.code === skillId);
  };
}

/**
 * Get a single framework by ID from cached data
 */
export function useFrameworkLookup() {
  const { data } = useFrameworks();
  return (frameworkId: string): CatalogFramework | undefined => {
    return data?.items.find(f => f.id === frameworkId || f.code === frameworkId);
  };
}

/**
 * Get a single segment by ID from cached data
 */
export function useSegmentLookup() {
  const { data } = useSegments();
  return (segmentId: string): CatalogSegment | undefined => {
    return data?.items.find(s => s.id === segmentId || s.code === segmentId);
  };
}

/**
 * Get a single service segment by ID or name from cached data
 */
export function useServiceSegmentLookup() {
  const { data } = useServiceSegments();
  return (segmentId: string): ServiceSegment | undefined => {
    return data?.items.find(s => s.id === segmentId || s.name === segmentId);
  };
}

/**
 * Get a single product by ID from cached data
 */
export function useProductLookup() {
  const { data } = useProducts();
  return (productId: string): CatalogProduct | undefined => {
    return data?.items.find(p => p.id === productId || p.code === productId);
  };
}
