'use client';

import { useMemo } from 'react';
import { Box } from '@mui/material';
import { CatalogFilterSection, type CatalogItem } from '@/components/catalog';
import {
  useFrameworks,
  useProducts,
  useSkills,
  useRoles,
  useSegments,
  useServiceSegments,
} from '@/hooks/useZeroBiasCatalog';
import { type EnabledFilters, type FilterType, FILTER_ICONS } from './FilterEnabler';

// Each filter category tracks selected items and which are disabled (paused from filtering)
export interface FilterCategoryState {
  selected: string[];   // All added items (shown as chips)
  disabled: string[];   // Subset of selected that are temporarily paused from filtering
}

export interface CatalogFiltersState {
  frameworks: FilterCategoryState;
  products: FilterCategoryState;
  skills: FilterCategoryState;
  roles: FilterCategoryState;
  segments: FilterCategoryState;
  serviceSegments: FilterCategoryState;
}

// Backward compatibility alias
export type ProviderFiltersState = CatalogFiltersState;

// Helper to get only active (non-disabled) filter IDs
export function getActiveFilters(category: FilterCategoryState): string[] {
  return category.selected.filter(id => !category.disabled.includes(id));
}

export interface CatalogFiltersProps {
  filters: CatalogFiltersState;
  onChange: (filters: CatalogFiltersState) => void;
  enabledFilters: EnabledFilters;
  onRemoveFilter: (filterType: FilterType) => void;
}

export function CatalogFilters({
  filters,
  onChange,
  enabledFilters,
  onRemoveFilter,
}: CatalogFiltersProps) {
  // Fetch catalog data
  const { data: frameworksData, isLoading: frameworksLoading } = useFrameworks();
  const { data: productsData, isLoading: productsLoading } = useProducts();
  const { data: skillsData, isLoading: skillsLoading } = useSkills();
  const { data: rolesData, isLoading: rolesLoading } = useRoles();
  const { data: segmentsData, isLoading: segmentsLoading } = useSegments();
  const { data: serviceSegmentsData, isLoading: serviceSegmentsLoading } = useServiceSegments();

  // Transform catalog data to CatalogItem format
  const frameworkItems: CatalogItem[] = useMemo(() => {
    return (frameworksData?.items || []).map((f) => ({
      id: f.id,
      name: f.name,
      code: f.code,
      description: f.description,
    }));
  }, [frameworksData]);

  const productItems: CatalogItem[] = useMemo(() => {
    const seen = new Set<string>();
    return (productsData?.items || [])
      .filter((p) => {
        if (seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      })
      .map((p) => ({
        id: p.id,
        name: p.name,
        code: p.code,
        description: p.description,
        group: p.vendorName || undefined,
      }))
      .sort((a, b) => (a.group || '').localeCompare(b.group || ''));
  }, [productsData]);

  const skillItems: CatalogItem[] = useMemo(() => {
    return (skillsData?.items || []).map((s) => {
      // Use description as display name, trim "Skill in " prefix
      const displayName = s.description
        ? s.description.replace(/^Skill in /i, '')
        : s.name;
      return {
        id: s.id,
        name: displayName,
        code: s.code,
        description: s.description,
      };
    });
  }, [skillsData]);

  const roleItems: CatalogItem[] = useMemo(() => {
    return (rolesData?.items || [])
      .map((r) => ({
        id: r.id,
        name: r.name,
        code: r.code,
        description: r.description,
        group: r.categoryName || undefined,
      }))
      .sort((a, b) => (a.group || '').localeCompare(b.group || ''));
  }, [rolesData]);

  const segmentItems: CatalogItem[] = useMemo(() => {
    return (segmentsData?.items || []).map((s) => ({
      id: s.id,
      name: s.name,
      code: s.code,
      description: s.description,
    }));
  }, [segmentsData]);

  const serviceSegmentItems: CatalogItem[] = useMemo(() => {
    return (serviceSegmentsData?.items || []).map((s) => ({
      id: s.id,
      name: s.description || s.name, // Use description as display name
      code: s.name, // The short code (e.g., "soc")
      description: s.description,
    }));
  }, [serviceSegmentsData]);

  // Update selected items for a filter category
  const updateSelected = (key: keyof CatalogFiltersState) => (values: string[]) => {
    // When items are removed from selected, also remove from disabled
    const currentDisabled = filters[key].disabled;
    const newDisabled = currentDisabled.filter(id => values.includes(id));
    onChange({ ...filters, [key]: { selected: values, disabled: newDisabled } });
  };

  // Update disabled items for a filter category
  const updateDisabled = (key: keyof CatalogFiltersState) => (values: string[]) => {
    onChange({ ...filters, [key]: { ...filters[key], disabled: values } });
  };

  // Check if any filters are enabled
  const hasEnabledFilters = Object.values(enabledFilters).some(Boolean);

  if (!hasEnabledFilters) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Service Categories - FIRST (professional service categories, small list) */}
      {enabledFilters.serviceCategories && (
        <CatalogFilterSection
          title="Service Categories"
          icon={<FILTER_ICONS.serviceCategories fontSize="small" />}
          items={serviceSegmentItems}
          selected={filters.serviceSegments.selected}
          onChange={updateSelected('serviceSegments')}
          disabled={filters.serviceSegments.disabled}
          onDisabledChange={updateDisabled('serviceSegments')}
          showAllAsChips
          loading={serviceSegmentsLoading}
          collapsible={false}
          onRemove={() => onRemoveFilter('serviceCategories')}
        />
      )}

      {/* Frameworks - Autocomplete (large list - 266+ items) */}
      {enabledFilters.frameworks && (
        <CatalogFilterSection
          title="Frameworks"
          icon={<FILTER_ICONS.frameworks fontSize="small" />}
          items={frameworkItems}
          selected={filters.frameworks.selected}
          onChange={updateSelected('frameworks')}
          disabled={filters.frameworks.disabled}
          onDisabledChange={updateDisabled('frameworks')}
          placeholder="Search frameworks (SOC 2, ISO 27001, HIPAA...)"
          loading={frameworksLoading}
          onRemove={() => onRemoveFilter('frameworks')}
        />
      )}

      {/* Products - Autocomplete */}
      {enabledFilters.products && (
        <CatalogFilterSection
          title="Products"
          icon={<FILTER_ICONS.products fontSize="small" />}
          items={productItems}
          selected={filters.products.selected}
          onChange={updateSelected('products')}
          disabled={filters.products.disabled}
          onDisabledChange={updateDisabled('products')}
          placeholder="Search products (AWS, GitHub, Okta...)"
          loading={productsLoading}
          onRemove={() => onRemoveFilter('products')}
        />
      )}

      {/* Skills - Autocomplete */}
      {enabledFilters.skills && (
        <CatalogFilterSection
          title="Skills"
          icon={<FILTER_ICONS.skills fontSize="small" />}
          items={skillItems}
          selected={filters.skills.selected}
          onChange={updateSelected('skills')}
          disabled={filters.skills.disabled}
          onDisabledChange={updateDisabled('skills')}
          placeholder="Search skills..."
          loading={skillsLoading}
          onRemove={() => onRemoveFilter('skills')}
        />
      )}

      {/* Roles - Autocomplete */}
      {enabledFilters.roles && (
        <CatalogFilterSection
          title="Role Experience"
          icon={<FILTER_ICONS.roles fontSize="small" />}
          items={roleItems}
          selected={filters.roles.selected}
          onChange={updateSelected('roles')}
          disabled={filters.roles.disabled}
          onDisabledChange={updateDisabled('roles')}
          placeholder="Search roles..."
          loading={rolesLoading}
          onRemove={() => onRemoveFilter('roles')}
        />
      )}

      {/* Industry Segments - Autocomplete */}
      {enabledFilters.segments && (
        <CatalogFilterSection
          title="Industry Segments"
          icon={<FILTER_ICONS.segments fontSize="small" />}
          items={segmentItems}
          selected={filters.segments.selected}
          onChange={updateSelected('segments')}
          disabled={filters.segments.disabled}
          onDisabledChange={updateDisabled('segments')}
          placeholder="Search industries..."
          loading={segmentsLoading}
          onRemove={() => onRemoveFilter('segments')}
        />
      )}
    </Box>
  );
}

// Backward compatibility alias
export const ProviderFilters = CatalogFilters;

export default CatalogFilters;
