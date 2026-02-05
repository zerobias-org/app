'use client';

/**
 * RoleAutocomplete
 *
 * Autocomplete for selecting NICE Work Roles.
 * Groups roles by category.
 */

import { useRoles, useRoleCategories, CatalogRole } from '@/hooks/useZeroBiasCatalog';
import CatalogAutocomplete from './CatalogAutocomplete';

interface RoleAutocompleteProps {
  value: CatalogRole | null;
  onChange: (value: CatalogRole | null) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
}

export default function RoleAutocomplete({
  value,
  onChange,
  label = 'Work Role',
  placeholder = 'Search roles...',
  disabled = false,
  error = false,
  helperText,
}: RoleAutocompleteProps) {
  const { data: rolesData, isLoading: rolesLoading } = useRoles();
  const { data: categoriesData } = useRoleCategories();

  // Build category lookup map
  const categoryMap = new Map<string, string>();
  categoriesData?.items.forEach(cat => {
    categoryMap.set(cat.id, cat.name);
  });

  // Enrich roles with category names
  const enrichedRoles: CatalogRole[] = (rolesData?.items || []).map(role => ({
    ...role,
    categoryName: role.categoryId ? categoryMap.get(role.categoryId) || 'Other' : 'Other',
  }));

  return (
    <CatalogAutocomplete<CatalogRole>
      items={enrichedRoles}
      loading={rolesLoading}
      value={value}
      onChange={onChange}
      label={label}
      placeholder={placeholder}
      disabled={disabled}
      error={error}
      helperText={helperText}
      showCode={true}
      groupBy={(option) => option.categoryName || 'Other'}
    />
  );
}
