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
  Add as AddIcon,
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
  /** Icon component to display next to title */
  icon?: React.ReactNode;
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
  icon,
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
  const [showAutocomplete, setShowAutocomplete] = useState(false);

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
    setShowAutocomplete(false); // Hide autocomplete after selection
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
          {icon && (
            <Box sx={{ display: 'flex', color: 'action.active' }}>
              {icon}
            </Box>
          )}
          <Typography variant="subtitle2" fontWeight={600}>
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
          {/* Add button for autocomplete mode (not showAllAsChips) */}
          {!showAllAsChips && !collapsed && (
            <Tooltip title="Add filter" arrow placement="top">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAutocomplete(!showAutocomplete);
                }}
                sx={{
                  mr: 0.5,
                  color: showAutocomplete ? 'primary.main' : 'action.active',
                }}
              >
                <AddIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
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
            {/* Selected items as toggleable chips */}
            {hasSelections && (
              <Box sx={{ mb: showAutocomplete ? 1.5 : 0 }}>
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

            {/* Autocomplete - only shown when + Add is clicked */}
            <Collapse in={showAutocomplete}>
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
                open={showAutocomplete}
                onClose={(_, reason) => {
                  // Only close on blur or escape, not when clicking the input
                  if (reason === 'blur' || reason === 'escape') {
                    setShowAutocomplete(false);
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder={placeholder}
                    autoFocus
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
                  return (
                    <Tooltip
                      key={option.id}
                      title={option.description || ''}
                      placement="right"
                      enterDelay={400}
                      arrow
                    >
                      <li {...rest} style={{ padding: '6px 12px' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 2 }}>
                          <Typography variant="body2" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {option.name}
                          </Typography>
                          {option.code && (
                            <Box
                              component="span"
                              sx={{
                                px: 0.75,
                                py: 0.25,
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                bgcolor: 'action.selected',
                                borderRadius: 1,
                                flexShrink: 0,
                                color: 'text.secondary',
                                textTransform: 'uppercase',
                              }}
                            >
                              {option.code}
                            </Box>
                          )}
                        </Box>
                      </li>
                    </Tooltip>
                  );
                }}
                noOptionsText="No matches found"
                clearOnBlur
                blurOnSelect
              />
            </Collapse>

            {/* Empty state hint - clickable */}
            {!hasSelections && !showAutocomplete && (
              <Box
                onClick={() => setShowAutocomplete(true)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  cursor: 'pointer',
                  color: 'text.secondary',
                  '&:hover': {
                    color: 'primary.main',
                  },
                }}
              >
                <Typography variant="caption">Click</Typography>
                <IconButton
                  size="small"
                  sx={{
                    width: 24,
                    height: 24,
                    color: 'inherit',
                    bgcolor: 'action.hover',
                  }}
                  tabIndex={-1}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
                <Typography variant="caption">to add filters</Typography>
              </Box>
            )}
          </>
        )}
      </Collapse>
    </Paper>
  );
}
