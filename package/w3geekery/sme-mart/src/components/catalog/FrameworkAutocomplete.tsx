'use client';

/**
 * FrameworkAutocomplete
 *
 * Autocomplete for selecting compliance frameworks.
 * Small list (12 frameworks) so shows all options.
 */

import { useFrameworks, CatalogFramework } from '@/hooks/useZeroBiasCatalog';
import CatalogAutocomplete from './CatalogAutocomplete';

interface FrameworkAutocompleteProps {
  value: CatalogFramework | null;
  onChange: (value: CatalogFramework | null) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
}

export default function FrameworkAutocomplete({
  value,
  onChange,
  label = 'Framework',
  placeholder = 'Search frameworks...',
  disabled = false,
  error = false,
  helperText,
}: FrameworkAutocompleteProps) {
  const { data: frameworksData, isLoading } = useFrameworks();

  return (
    <CatalogAutocomplete<CatalogFramework>
      items={frameworksData?.items || []}
      loading={isLoading}
      value={value}
      onChange={onChange}
      label={label}
      placeholder={placeholder}
      disabled={disabled}
      error={error}
      helperText={helperText}
      showCode={true}
    />
  );
}
