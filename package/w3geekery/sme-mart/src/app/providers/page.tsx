'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useMediaQuery,
  useTheme,
  Drawer,
  IconButton,
  Button,
} from '@mui/material';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { ProviderCard, type ProviderCardData } from '@/components/marketplace/ProviderCard';
import { ProviderFilters, getActiveFilters } from '@/components/marketplace/ProviderFilters';
import { FilterEnabler, type FilterType } from '@/components/marketplace/FilterEnabler';
import { useFilterPreferences } from '@/hooks/useFilterPreferences';

// Extended provider data for filtering (includes catalog relationships)
interface ProviderWithCatalog extends ProviderCardData {
  roles?: { zerobiasRoleId: string }[];
  products?: { zerobiasProductId: string }[];
  frameworks?: { zerobiasFrameworkId: string }[];
  segments?: { zerobiasSegmentId: string }[];
}

type SortOption = 'rating' | 'rate-low' | 'rate-high' | 'jobs';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'rating', label: 'Highest Rated' },
  { value: 'rate-low', label: 'Rate: Low to High' },
  { value: 'rate-high', label: 'Rate: High to Low' },
  { value: 'jobs', label: 'Most Jobs Completed' },
];

const FILTER_DRAWER_WIDTH = 320;

export default function ProvidersPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [providers, setProviders] = useState<ProviderWithCatalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Filter drawer state (mobile)
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Basic filter state (not persisted)
  const [searchQuery, setSearchQuery] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('rating');

  // Persisted filter state from PKV
  const {
    enabledFilters,
    catalogFilters,
    loading: preferencesLoading,
    activeFilterCount: activeCatalogFilterCount,
    toggleFilter,
    removeFilter,
    clearAll,
    setCatalogFilters,
  } = useFilterPreferences();

  useEffect(() => {
    // Fetch providers with full catalog relationships
    fetch('/api/providers?include=all')
      .then((res) => res.json())
      .then((data) => setProviders(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  // Handlers use the hook functions directly
  const handleToggleFilter = useCallback((filterType: FilterType) => {
    toggleFilter(filterType);
  }, [toggleFilter]);

  const handleRemoveFilter = useCallback((filterType: FilterType) => {
    removeFilter(filterType);
  }, [removeFilter]);

  const handleClearAll = useCallback(() => {
    clearAll();
  }, [clearAll]);

  const filtered = useMemo(() => {
    let result = [...providers];

    // Get only active (non-disabled) filters for each category
    const activeFrameworks = getActiveFilters(catalogFilters.frameworks);
    const activeProducts = getActiveFilters(catalogFilters.products);
    const activeSkills = getActiveFilters(catalogFilters.skills);
    const activeRoles = getActiveFilters(catalogFilters.roles);
    const activeSegments = getActiveFilters(catalogFilters.segments);
    const activeServiceSegments = getActiveFilters(catalogFilters.serviceSegments);

    // Text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.displayName.toLowerCase().includes(q) ||
          (p.headline && p.headline.toLowerCase().includes(q)) ||
          p.skills.some((s) => s.skillName?.toLowerCase().includes(q))
      );
    }

    // Availability filter
    if (availableOnly) {
      result = result.filter((p) => p.availabilityStatus === 'available');
    }

    // Framework filter - provider must have ALL active frameworks
    if (activeFrameworks.length > 0) {
      result = result.filter((p) => {
        if (!p.frameworks) return false;
        return activeFrameworks.every((fId) =>
          p.frameworks!.some((f) => f.zerobiasFrameworkId === fId)
        );
      });
    }

    // Product filter - provider must have ALL active products
    if (activeProducts.length > 0) {
      result = result.filter((p) => {
        if (!p.products) return false;
        return activeProducts.every((pId) =>
          p.products!.some((prod) => prod.zerobiasProductId === pId)
        );
      });
    }

    // Skill filter - provider must have ALL active skills
    if (activeSkills.length > 0) {
      result = result.filter((p) => {
        if (!p.skills) return false;
        return activeSkills.every((sId) =>
          p.skills.some((skill) => skill.zerobiasSkillId === sId)
        );
      });
    }

    // Role filter - provider must have ANY of the active roles
    if (activeRoles.length > 0) {
      result = result.filter((p) => {
        if (!p.roles) return false;
        return activeRoles.some((rId) =>
          p.roles!.some((role) => role.zerobiasRoleId === rId)
        );
      });
    }

    // Segment filter - provider must have ANY of the active segments
    if (activeSegments.length > 0) {
      result = result.filter((p) => {
        if (!p.segments) return false;
        return activeSegments.some((sId) =>
          p.segments!.some((seg) => seg.zerobiasSegmentId === sId)
        );
      });
    }

    // Service segment filter - provider must have ANY service offering matching active categories
    if (activeServiceSegments.length > 0) {
      result = result.filter((p) => {
        if (!p.serviceOfferings || p.serviceOfferings.length === 0) return false;
        return activeServiceSegments.some((segId) =>
          p.serviceOfferings.some((so) =>
            so.zerobiasServiceSegmentId === segId ||
            so.category?.toLowerCase() === segId.toLowerCase()
          )
        );
      });
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return (parseFloat(b.ratingAverage || '0')) - (parseFloat(a.ratingAverage || '0'));
        case 'rate-low':
          return (parseFloat(a.hourlyRate || '0')) - (parseFloat(b.hourlyRate || '0'));
        case 'rate-high':
          return (parseFloat(b.hourlyRate || '0')) - (parseFloat(a.hourlyRate || '0'));
        case 'jobs':
          return b.totalJobsCompleted - a.totalJobsCompleted;
        default:
          return 0;
      }
    });

    return result;
  }, [providers, searchQuery, availableOnly, sortBy, catalogFilters]);

  const filterPanel = (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <FilterEnabler
        enabledFilters={enabledFilters}
        onToggleFilter={handleToggleFilter}
        onClearAll={handleClearAll}
        activeFilterCount={activeCatalogFilterCount}
      />
      <ProviderFilters
        filters={catalogFilters}
        onChange={setCatalogFilters}
        enabledFilters={enabledFilters}
        onRemoveFilter={handleRemoveFilter}
      />
    </Box>
  );

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Page Header */}
      <Typography variant="h4" fontWeight={600} gutterBottom>
        Find Experts
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Browse compliance professionals by framework, product, skills, or availability
      </Typography>

      {/* Search Bar + Sort + Available + Mobile Filter Toggle */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          sx={{ flex: 1, minWidth: 200 }}
          placeholder="Search by name, headline, or skill..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={20} />
                </InputAdornment>
              ),
            },
          }}
        />

        {/* Sort */}
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Sort by</InputLabel>
          <Select
            value={sortBy}
            label="Sort by"
            onChange={(e) => setSortBy(e.target.value as SortOption)}
          >
            {SORT_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Available Only Toggle */}
        <Chip
          label="Available Only"
          onClick={() => setAvailableOnly(!availableOnly)}
          variant={availableOnly ? 'filled' : 'outlined'}
          color={availableOnly ? 'success' : 'default'}
          sx={{ cursor: 'pointer' }}
        />

        {/* Mobile Filter Toggle */}
        {isMobile && (
          <Button
            variant="outlined"
            onClick={() => setDrawerOpen(true)}
            sx={{ minWidth: 'auto', px: 2 }}
          >
            <SlidersHorizontal size={20} />
            {activeCatalogFilterCount > 0 && (
              <Chip
                label={activeCatalogFilterCount}
                size="small"
                color="primary"
                sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
              />
            )}
          </Button>
        )}
      </Box>

      {/* Main Content: Sidebar + Results */}
      <Box sx={{ display: 'flex', gap: 3 }}>
        {/* Desktop Filter Sidebar */}
        {!isMobile && (
          <Box
            sx={{
              width: FILTER_DRAWER_WIDTH,
              flexShrink: 0,
            }}
          >
            {filterPanel}
          </Box>
        )}

        {/* Results Column */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* Results Count */}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Showing {filtered.length} provider{filtered.length !== 1 ? 's' : ''}
            {activeCatalogFilterCount > 0 && ` (${activeCatalogFilterCount} filters applied)`}
          </Typography>

          {/* Results */}
          {loading || preferencesLoading ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <CircularProgress size={40} />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ my: 4 }}>
              Failed to load providers. Please try again later.
            </Alert>
          ) : filtered.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No providers match your filters
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try adjusting your search or filters to find what you&apos;re looking for.
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {filtered.map((provider) => (
                <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={provider.id}>
                  <ProviderCard provider={provider} />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Box>

      {/* Mobile Filter Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: { width: '100%', maxWidth: FILTER_DRAWER_WIDTH, p: 2 },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight={600}>
            Filters
          </Typography>
          <IconButton onClick={() => setDrawerOpen(false)}>
            <X size={20} />
          </IconButton>
        </Box>
        {filterPanel}
        <Button
          variant="contained"
          fullWidth
          sx={{ mt: 3 }}
          onClick={() => setDrawerOpen(false)}
        >
          Show {filtered.length} Results
        </Button>
      </Drawer>
    </Container>
  );
}
