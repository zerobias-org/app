'use client';

/**
 * SegmentAutocomplete
 *
 * Autocomplete for selecting industry/market segments.
 * Medium list (128 segments).
 */

import { useSegments, CatalogSegment } from '@/hooks/useZeroBiasCatalog';
import CatalogAutocomplete from './CatalogAutocomplete';

interface SegmentAutocompleteProps {
  value: CatalogSegment | null;
  onChange: (value: CatalogSegment | null) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
}

export default function SegmentAutocomplete({
  value,
  onChange,
  label = 'Market Segment',
  placeholder = 'Search segments...',
  disabled = false,
  error = false,
  helperText,
}: SegmentAutocompleteProps) {
  const { data: segmentsData, isLoading } = useSegments();

  return (
    <CatalogAutocomplete<CatalogSegment>
      items={segmentsData?.items || []}
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
