'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
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
  Skeleton,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Add as AddIcon,
} from '@mui/icons-material';

export interface CatalogItem {
  id: string;
  name: string;
  code?: string;
  description?: string;
  group?: string;
}

export interface ProfileItem {
  id: string;
}

interface ProfileExperienceSectionProps<T extends ProfileItem> {
  /** Section title */
  title: string;
  /** Icon component to display next to title */
  icon?: React.ReactNode;
  /** All available items from the catalog */
  catalogItems: CatalogItem[];
  /** Currently added profile items */
  items: T[];
  /** Render the label content for a chip */
  renderChipLabel: (item: T, catalogItem: CatalogItem | undefined) => React.ReactNode;
  /** Get chip props (color, variant, icon) based on item */
  getChipProps?: (item: T) => {
    color?: 'default' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
    variant?: 'filled' | 'outlined';
    icon?: React.ReactNode;
  };
  /** Callback when an item is selected from autocomplete (add new) */
  onAdd: (catalogItem: CatalogItem) => void;
  /** Callback when chip is clicked (edit) - optional */
  onEdit?: (item: T) => void;
  /** Callback when chip delete is clicked */
  onDelete: (item: T) => void;
  /** Placeholder text for autocomplete */
  placeholder?: string;
  /** Whether section is collapsible */
  collapsible?: boolean;
  /** Initial collapsed state */
  defaultCollapsed?: boolean;
  /** Loading state for profile data */
  profileLoading?: boolean;
  /** Loading state for catalog data */
  catalogLoading?: boolean;
  /** Adding in progress */
  isAdding?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Get the catalog ID from a profile item */
  getCatalogId: (item: T) => string;
}

// Skeleton placeholder for chip sections
function ChipSkeleton({ count = 3 }: { count?: number }) {
  const widths = [120, 150, 100, 140, 110, 130];
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton
          key={i}
          variant="rounded"
          width={widths[i % widths.length]}
          height={32}
          sx={{ borderRadius: '16px' }}
        />
      ))}
    </Box>
  );
}

export function ProfileExperienceSection<T extends ProfileItem>({
  title,
  icon,
  catalogItems,
  items,
  renderChipLabel,
  getChipProps,
  onAdd,
  onEdit,
  onDelete,
  placeholder = 'Search...',
  collapsible = true,
  defaultCollapsed = false,
  profileLoading = false,
  catalogLoading = false,
  isAdding = false,
  emptyMessage = 'No items added yet.',
  getCatalogId,
}: ProfileExperienceSectionProps<T>) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [inputValue, setInputValue] = useState('');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [pendingItem, setPendingItem] = useState<CatalogItem | null>(null);
  const prevItemsLength = useRef(items.length);

  // Clear pending item when items array changes (add succeeded)
  useEffect(() => {
    if (items.length !== prevItemsLength.current) {
      setPendingItem(null);
      prevItemsLength.current = items.length;
    }
  }, [items.length]);

  // Clear pending item after timeout (in case of error with no feedback)
  useEffect(() => {
    if (pendingItem) {
      const timeout = setTimeout(() => setPendingItem(null), 5000);
      return () => clearTimeout(timeout);
    }
  }, [pendingItem]);

  // Get catalog items that are already added
  const addedCatalogIds = useMemo(() => {
    return new Set(items.map(getCatalogId));
  }, [items, getCatalogId]);

  // Items available for autocomplete (exclude already added)
  const availableItems = useMemo(() => {
    return catalogItems.filter((item) => !addedCatalogIds.has(item.id));
  }, [catalogItems, addedCatalogIds]);

  // Lookup helper
  const getCatalogItem = (catalogId: string) => {
    return catalogItems.find((item) => item.id === catalogId || item.code === catalogId);
  };

  const handleAutocompleteSelect = (catalogItem: CatalogItem | null) => {
    if (catalogItem) {
      setPendingItem(catalogItem);
      onAdd(catalogItem);
    }
    setInputValue('');
    setShowAutocomplete(false);
  };

  const isLoading = profileLoading || catalogLoading;
  const hasItems = items.length > 0;

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderColor: hasItems ? 'primary.main' : 'divider',
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
          {hasItems && (
            <Chip
              label={items.length}
              size="small"
              color="primary"
              variant="filled"
              sx={{ height: 20, fontSize: '0.7rem' }}
            />
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {/* Add button */}
          {!collapsed && (
            <Tooltip title={`Add ${title.toLowerCase()}`} arrow placement="top">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAutocomplete(!showAutocomplete);
                }}
                disabled={isLoading || isAdding}
                sx={{
                  mr: 0.5,
                  color: showAutocomplete ? 'primary.main' : 'action.active',
                }}
              >
                <AddIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {collapsible && (
            <IconButton size="small">
              {collapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
            </IconButton>
          )}
        </Box>
      </Box>

      <Collapse in={!collapsed}>
        {isLoading ? (
          <ChipSkeleton count={3} />
        ) : (
          <>
            {/* Existing items as chips */}
            {(hasItems || pendingItem) && (
              <Box sx={{ mb: showAutocomplete ? 1.5 : 0 }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {items.map((item) => {
                    const catalogItem = getCatalogItem(getCatalogId(item));
                    const chipProps = getChipProps?.(item) || {};
                    return (
                      <Chip
                        key={item.id}
                        label={renderChipLabel(item, catalogItem)}
                        size="small"
                        color={chipProps.color || 'default'}
                        variant={chipProps.variant || 'outlined'}
                        icon={chipProps.icon as React.ReactElement | undefined}
                        onClick={onEdit ? () => onEdit(item) : undefined}
                        onDelete={() => onDelete(item)}
                        sx={{ cursor: onEdit ? 'pointer' : 'default' }}
                      />
                    );
                  })}
                  {/* Skeleton chip for pending add */}
                  {pendingItem && (
                    <Chip
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Skeleton variant="text" width={80} height={16} />
                        </Box>
                      }
                      size="small"
                      variant="outlined"
                      sx={{ opacity: 0.6 }}
                    />
                  )}
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
                loading={catalogLoading}
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
            {!hasItems && !pendingItem && !showAutocomplete && (
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
                <Typography variant="caption">to add {title.toLowerCase()}</Typography>
              </Box>
            )}
          </>
        )}
      </Collapse>
    </Paper>
  );
}
