'use client';

/**
 * ProductAutocomplete
 *
 * Autocomplete for selecting products from the ZeroBias catalog.
 * Shows vendor name alongside product name.
 */

import { useProducts, CatalogProduct } from '@/hooks/useZeroBiasCatalog';
import CatalogAutocomplete from './CatalogAutocomplete';
import { Box, Typography, Chip } from '@mui/material';

interface ProductAutocompleteProps {
  value: CatalogProduct | null;
  onChange: (value: CatalogProduct | null) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
}

export default function ProductAutocomplete({
  value,
  onChange,
  label = 'Product',
  placeholder = 'Search products...',
  disabled = false,
  error = false,
  helperText,
}: ProductAutocompleteProps) {
  const { data: productsData, isLoading } = useProducts();

  // Custom render to show vendor info
  const renderOption = (props: React.HTMLAttributes<HTMLLIElement>, option: CatalogProduct) => {
    const { key, ...restProps } = props as React.HTMLAttributes<HTMLLIElement> & { key?: string };
    return (
      <li key={key || option.id} {...restProps}>
        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body1">{option.name}</Typography>
            {option.vendorName && (
              <Chip label={option.vendorName} size="small" variant="outlined" sx={{ height: 20 }} />
            )}
          </Box>
          {option.suiteName && (
            <Typography variant="caption" color="text.secondary">
              Suite: {option.suiteName}
            </Typography>
          )}
        </Box>
      </li>
    );
  };

  // Group by vendor
  const groupBy = (option: CatalogProduct) => option.vendorName || 'Other';

  return (
    <CatalogAutocomplete<CatalogProduct>
      items={productsData?.items || []}
      loading={isLoading}
      value={value}
      onChange={onChange}
      label={label}
      placeholder={placeholder}
      disabled={disabled}
      error={error}
      helperText={helperText}
      showCode={false}
      renderOption={renderOption}
      groupBy={groupBy}
    />
  );
}
