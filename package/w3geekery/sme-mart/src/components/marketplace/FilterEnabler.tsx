'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  Typography,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Check as CheckIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Category as CategoryIcon,
  Security as FrameworkIcon,
  Inventory2 as ProductIcon,
  Construction as SkillIcon,
  Badge as RoleIcon,
  Business as SegmentIcon,
} from '@mui/icons-material';
import type { SvgIconComponent } from '@mui/icons-material';

// Export icons for use in filter sections
export const FILTER_ICONS: Record<FilterType, SvgIconComponent> = {
  serviceCategories: CategoryIcon,
  frameworks: FrameworkIcon,
  products: ProductIcon,
  skills: SkillIcon,
  roles: RoleIcon,
  segments: SegmentIcon,
};

// Filter type definitions
export type FilterType =
  | 'serviceCategories'
  | 'frameworks'
  | 'products'
  | 'skills'
  | 'roles'
  | 'segments';

export interface EnabledFilters {
  serviceCategories: boolean;
  frameworks: boolean;
  products: boolean;
  skills: boolean;
  roles: boolean;
  segments: boolean;
}

// Filter type metadata for display
const FILTER_TYPES: { key: FilterType; label: string; Icon: SvgIconComponent }[] = [
  { key: 'serviceCategories', label: 'Service Categories', Icon: CategoryIcon },
  { key: 'frameworks', label: 'Frameworks', Icon: FrameworkIcon },
  { key: 'products', label: 'Products', Icon: ProductIcon },
  { key: 'skills', label: 'Skills', Icon: SkillIcon },
  { key: 'roles', label: 'Role Experience', Icon: RoleIcon },
  { key: 'segments', label: 'Industry Segments', Icon: SegmentIcon },
];

interface FilterEnablerProps {
  enabledFilters: EnabledFilters;
  onToggleFilter: (filterType: FilterType) => void;
  onClearAll: () => void;
  activeFilterCount: number;
}

export function FilterEnabler({
  enabledFilters,
  onToggleFilter,
  onClearAll,
  activeFilterCount,
}: FilterEnablerProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleToggle = (filterType: FilterType) => {
    onToggleFilter(filterType);
    // Don't close menu so user can enable multiple filters
  };

  const enabledCount = Object.values(enabledFilters).filter(Boolean).length;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterIcon fontSize="small" color="action" />
          <Typography variant="subtitle1" fontWeight={600}>
            Filters
          </Typography>
          {activeFilterCount > 0 && (
            <Chip
              label={`${activeFilterCount} active`}
              size="small"
              color="primary"
              sx={{ height: 22 }}
            />
          )}
        </Box>
        {activeFilterCount > 0 && (
          <Button
            size="small"
            startIcon={<ClearIcon />}
            onClick={onClearAll}
            color="inherit"
          >
            Clear All
          </Button>
        )}
      </Box>

      {/* Add Filter Button */}
      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={handleClick}
        size="small"
        sx={{ alignSelf: 'flex-start' }}
      >
        Add Filter
        {enabledCount > 0 && (
          <Chip
            label={enabledCount}
            size="small"
            sx={{ ml: 1, height: 18, fontSize: '0.7rem' }}
          />
        )}
      </Button>

      {/* Filter Type Menu */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        slotProps={{
          list: {
            style: { paddingLeft: 0, paddingTop: 4, paddingBottom: 4 },
          },
          paper: {
            sx: {
              '& .MuiMenuItem-root': {
                alignItems: 'flex-start',
              },
            },
          },
        }}
      >
        {FILTER_TYPES.map(({ key, label, Icon }) => (
          <MenuItem
            key={key}
            onClick={() => handleToggle(key)}
            sx={{ minWidth: 200, py: 0.75, px: 1.5 }}
            style={{ gap: '4px' }}
          >
            <ListItemIcon style={{ minWidth: '26px' }}>
              {enabledFilters[key] ? (
                <CheckIcon fontSize="small" color="primary" />
              ) : (
                <Icon fontSize="small" color="action" />
              )}
            </ListItemIcon>
            <Typography variant="body2">{label}</Typography>
          </MenuItem>
        ))}
      </Menu>

      {/* Empty state hint */}
      {enabledCount === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          Click &quot;Add Filter&quot; to enable filter sections
        </Typography>
      )}
    </Box>
  );
}

export default FilterEnabler;
