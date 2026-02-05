'use client';

import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Chip,
  TextField,
  Autocomplete,
  Collapse,
  IconButton,
  Paper,
  Tooltip,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

export interface CatalogItem {
  id: string;
  name: string;
  code?: string;
  description?: string;
  // Optional grouping field (e.g., vendorName for products, categoryName for roles)
  group?: string;
}

interface CatalogFilterSectionProps {
  /** Section title */
  title: string;
  /** All available items from the catalog */
  items: CatalogItem[];
  /** Currently selected item IDs */
  selected: string[];
  /** Callback when selection changes */
  onChange: (selected: string[]) => void;
  /** Disabled item IDs (subset of selected - paused from filtering) */
  disabled?: string[];
  /** Callback when disabled items change */
  onDisabledChange?: (disabled: string[]) => void;
  /** Show all items as chips (for small lists like frameworks, service categories) */
  showAllAsChips?: boolean;
  /** Placeholder text for autocomplete */
  placeholder?: string;
  /** Whether section is collapsible */
  collapsible?: boolean;
  /** Initial collapsed state */
  defaultCollapsed?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Callback to remove/hide this filter section */
  onRemove?: () => void;
}

export function CatalogFilterSection({
  title,
  items,
  selected,
  onChange,
  disabled = [],
  onDisabledChange,
  showAllAsChips = false,
  placeholder = 'Search...',
  collapsible = true,
  defaultCollapsed = false,
  loading = false,
  onRemove,
}: CatalogFilterSectionProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [inputValue, setInputValue] = useState('');

  // Get selected items as full objects
  const selectedItems = useMemo(() => {
    return selected
      .map((id) => items.find((item) => item.id === id))
      .filter((item): item is CatalogItem => !!item);
  }, [selected, items]);

  // Items available for autocomplete (exclude already selected)
  const availableItems = useMemo(() => {
    return items.filter((item) => !selected.includes(item.id));
  }, [items, selected]);

  // For showAllAsChips mode: toggle between not-selected / selected+enabled / selected+disabled
  const handleToggle = (id: string) => {
    const isSelected = selected.includes(id);
    const isDisabled = disabled.includes(id);

    if (!isSelected) {
      // Not selected -> add as enabled
      onChange([...selected, id]);
    } else if (!isDisabled) {
      // Selected + enabled -> toggle to disabled
      onDisabledChange?.([...disabled, id]);
    } else {
      // Selected + disabled -> toggle back to enabled
      onDisabledChange?.(disabled.filter(d => d !== id));
    }
  };

  // Toggle enabled/disabled state for a chip (autocomplete mode)
  const handleToggleEnabled = (id: string) => {
    const isDisabled = disabled.includes(id);
    if (isDisabled) {
      onDisabledChange?.(disabled.filter(d => d !== id));
    } else {
      onDisabledChange?.([...disabled, id]);
    }
  };

  // Remove a chip entirely (removes from both selected and disabled)
  const handleRemove = (id: string) => {
    onChange(selected.filter((s) => s !== id));
    // Note: disabled cleanup happens in parent via updateSelected
  };

  const handleAutocompleteSelect = (item: CatalogItem | null) => {
    if (item && !selected.includes(item.id)) {
      onChange([...selected, item.id]);
    }
    setInputValue('');
  };

  const hasSelections = selected.length > 0;
  const activeCount = selected.filter(id => !disabled.includes(id)).length;
  const hasDisabled = disabled.length > 0;

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderColor: hasSelections ? 'primary.main' : 'divider',
        transition: 'border-color 0.2s',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: collapsible ? 'pointer' : 'default',
          mb: collapsed ? 0 : 1.5,
        }}
        onClick={() => collapsible && setCollapsed(!collapsed)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="subtitle2" fontWeight={600} style={{ margin: 0 }}>
            {title}
          </Typography>
          {hasSelections && (
            <Tooltip
              title={hasDisabled ? `${activeCount} active, ${disabled.length} paused` : `${activeCount} active`}
              arrow
              placement="top"
            >
              <Chip
                label={hasDisabled ? `${activeCount}/${selected.length}` : selected.length}
                size="small"
                color="primary"
                variant={activeCount > 0 ? 'filled' : 'outlined'}
                sx={{ height: 20, fontSize: '0.7rem' }}
              />
            </Tooltip>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {onRemove && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              sx={{ mr: 0.5 }}
              title="Remove filter"
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
          {collapsible && (
            <IconButton size="small">
              {collapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
            </IconButton>
          )}
        </Box>
      </Box>

      <Collapse in={!collapsed}>
        {/* Show all as chips mode (for small lists like frameworks, service categories) */}
        {showAllAsChips && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: hasSelections ? 0 : 0 }}>
            {items.map((item) => {
              const isSelected = selected.includes(item.id);
              const isDisabled = disabled.includes(item.id);
              const isActive = isSelected && !isDisabled;

              return (
                <Chip
                  key={item.id}
                  label={item.name}
                  size="small"
                  onClick={() => handleToggle(item.id)}
                  color={isSelected ? 'primary' : 'default'}
                  variant={isActive ? 'filled' : 'outlined'}
                  title={isSelected ? (isDisabled ? 'Click to enable filtering' : 'Click to pause filtering') : 'Click to add filter'}
                  sx={{
                    cursor: 'pointer',
                    fontWeight: isActive ? 600 : 400,
                    opacity: isDisabled ? 0.5 : 1,
                    '&:hover': {
                      bgcolor: isActive ? 'primary.dark' : 'action.hover',
                    },
                  }}
                />
              );
            })}
          </Box>
        )}

        {/* Autocomplete mode (for larger lists) */}
        {!showAllAsChips && (
          <>
            <Autocomplete
              size="small"
              options={availableItems}
              getOptionLabel={(option) => option.name}
              groupBy={(option) => option.group || ''}
              value={null}
              inputValue={inputValue}
              onInputChange={(_, value) => setInputValue(value)}
              onChange={(_, value) => handleAutocompleteSelect(value)}
              loading={loading}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder={placeholder}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'background.paper',
                    },
                  }}
                />
              )}
              renderOption={(props, option) => {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { key, ...rest } = props;
                // Use option.id as key instead of MUI's key (which is based on name and can have duplicates)
                return (
                  <li key={option.id} {...rest} style={{ padding: '4px 12px' }}>
                    <Typography variant="body2" style={{ margin: 0 }}>{option.name}</Typography>
                  </li>
                );
              }}
              noOptionsText="No matches found"
              clearOnBlur
              blurOnSelect
              sx={{ mb: hasSelections ? 1.5 : 0 }}
            />

            {/* Selected items as toggleable chips */}
            {hasSelections && (
              <Box>
                <Typography variant="caption" color="text.secondary" style={{ margin: 0, marginBottom: '4px', display: 'block' }}>
                  Selected (click to toggle):
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selectedItems.map((item) => {
                    const isDisabled = disabled.includes(item.id);
                    return (
                      <Tooltip
                        key={item.id}
                        title={isDisabled ? 'Click to enable filtering' : 'Click to pause filtering'}
                        arrow
                        placement="top"
                      >
                        <Chip
                          label={item.name}
                          size="small"
                          color="primary"
                          variant={isDisabled ? 'outlined' : 'filled'}
                          onClick={() => handleToggleEnabled(item.id)}
                          onDelete={() => handleRemove(item.id)}
                          deleteIcon={<CloseIcon fontSize="small" />}
                          sx={{
                            cursor: 'pointer',
                            opacity: isDisabled ? 0.6 : 1,
                            fontWeight: isDisabled ? 400 : 500,
                          }}
                        />
                      </Tooltip>
                    );
                  })}
                </Box>
              </Box>
            )}
          </>
        )}
      </Collapse>
    </Paper>
  );
}
