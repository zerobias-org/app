'use client';

/**
 * ServiceSegmentAutocomplete
 *
 * Autocomplete for selecting professional service categories.
 * Small list (9 service segments from ZeroBias tags).
 *
 * Service segments are: soc, pentesting, compliance, risk, training, etc.
 * These are professional service categories, not product categories.
 */

import { useMemo } from 'react';
import { useServiceSegments, ServiceSegment } from '@/hooks/useZeroBiasCatalog';
import CatalogAutocomplete from './CatalogAutocomplete';

// Convert ServiceSegment to CatalogItem-compatible shape for the autocomplete
interface ServiceSegmentItem {
  id: string;
  name: string;
  code: string;
  description?: string;
}

interface ServiceSegmentAutocompleteProps {
  value: ServiceSegmentItem | null;
  onChange: (value: ServiceSegmentItem | null) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
}

export default function ServiceSegmentAutocomplete({
  value,
  onChange,
  label = 'Service Category',
  placeholder = 'Search service categories...',
  disabled = false,
  error = false,
  helperText,
}: ServiceSegmentAutocompleteProps) {
  const { data: serviceSegmentsData, isLoading } = useServiceSegments();

  // Transform ServiceSegment (tag format) to CatalogItem format
  const items: ServiceSegmentItem[] = useMemo(() => {
    return (serviceSegmentsData?.items || []).map((seg: ServiceSegment) => ({
      id: seg.id,
      name: seg.description || seg.name, // Use description as display name (e.g., "Security Monitoring / Operations Center (SOC)")
      code: seg.name, // Use the short code (e.g., "soc")
      description: seg.description,
    }));
  }, [serviceSegmentsData]);

  return (
    <CatalogAutocomplete<ServiceSegmentItem>
      items={items}
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
