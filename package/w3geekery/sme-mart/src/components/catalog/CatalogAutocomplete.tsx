'use client';

/**
 * CatalogAutocomplete
 *
 * Generic autocomplete component for ZeroBias catalog items.
 * Used for: Roles, Skills, Products (larger lists needing search)
 */

import { useState, useMemo } from 'react';
import {
  Autocomplete,
  TextField,
  CircularProgress,
  Box,
  Typography,
  Chip,
} from '@mui/material';

export interface CatalogItem {
  id: string;
  name: string;
  code?: string;
  description?: string;
}

interface CatalogAutocompleteProps<T extends CatalogItem> {
  items: T[];
  loading?: boolean;
  value: T | null;
  onChange: (value: T | null) => void;
  label: string;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  /** Show code as chip next to name */
  showCode?: boolean;
  /** Custom render for option label */
  getOptionLabel?: (option: T) => string;
  /** Custom render for option */
  renderOption?: (props: React.HTMLAttributes<HTMLLIElement>, option: T) => React.ReactNode;
  /** Group options by this key */
  groupBy?: (option: T) => string;
  /** Filter function (default: name, code, description) */
  filterOptions?: (options: T[], inputValue: string) => T[];
}

export default function CatalogAutocomplete<T extends CatalogItem>({
  items,
  loading = false,
  value,
  onChange,
  label,
  placeholder,
  disabled = false,
  error = false,
  helperText,
  showCode = true,
  getOptionLabel,
  renderOption,
  groupBy,
  filterOptions,
}: CatalogAutocompleteProps<T>) {
  const [inputValue, setInputValue] = useState('');

  // Default option label
  const defaultGetOptionLabel = (option: T) => option.name;

  // Default filter (name, code, description)
  const defaultFilterOptions = (options: T[], input: string) => {
    if (!input) return options;
    const lower = input.toLowerCase();
    return options.filter(opt =>
      opt.name?.toLowerCase().includes(lower) ||
      opt.code?.toLowerCase().includes(lower) ||
      opt.description?.toLowerCase().includes(lower)
    );
  };

  // Apply filter
  const filteredOptions = useMemo(() => {
    const filterFn = filterOptions || defaultFilterOptions;
    return filterFn(items, inputValue);
  }, [items, inputValue, filterOptions]);

  // Default render option
  const defaultRenderOption = (props: React.HTMLAttributes<HTMLLIElement>, option: T) => {
    const { key, ...restProps } = props as React.HTMLAttributes<HTMLLIElement> & { key?: string };
    return (
      <li key={key || option.id} {...restProps}>
        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body1">{option.name}</Typography>
            {showCode && option.code && (
              <Chip label={option.code} size="small" variant="outlined" sx={{ height: 20 }} />
            )}
          </Box>
          {option.description && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100%',
              }}
            >
              {option.description}
            </Typography>
          )}
        </Box>
      </li>
    );
  };

  return (
    <Autocomplete
      value={value}
      onChange={(_, newValue) => onChange(newValue)}
      inputValue={inputValue}
      onInputChange={(_, newInputValue) => setInputValue(newInputValue)}
      options={filteredOptions}
      loading={loading}
      disabled={disabled}
      getOptionLabel={getOptionLabel || defaultGetOptionLabel}
      renderOption={renderOption || defaultRenderOption}
      groupBy={groupBy}
      isOptionEqualToValue={(option, val) => option.id === val.id}
      filterOptions={(x) => x} // We handle filtering ourselves
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          error={error}
          helperText={helperText}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      sx={{
        '& .MuiAutocomplete-option': {
          py: 1.5,
        },
      }}
    />
  );
}
