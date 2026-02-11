'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
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
import { ServiceCard, type ServiceCardData } from '@/components/marketplace/ServiceCard';
import { CatalogFilters, getActiveFilters } from '@/components/marketplace/ProviderFilters';
import { FilterEnabler, type FilterType } from '@/components/marketplace/FilterEnabler';
import { useFilterPreferences } from '@/hooks/useFilterPreferences';

// Extended service data for filtering (includes provider catalog relationships)
interface ServiceWithCatalog extends ServiceCardData {
  provider: ServiceCardData['provider'] & {
    roles?: { zerobiasRoleId: string }[];
    products?: { zerobiasProductId: string }[];
    frameworks?: { zerobiasFrameworkId: string }[];
    segments?: { zerobiasSegmentId: string }[];
    skills?: { zerobiasSkillId: string }[];
  };
}

type SortOption = 'newest' | 'price-low' | 'price-high';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
];

const FILTER_DRAWER_WIDTH = 320;

export default function ServicesPage() {
  const searchParams = useSearchParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [services, setServices] = useState<ServiceWithCatalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Filter drawer state (mobile)
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Basic filter state (not persisted)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPricingType, setSelectedPricingType] = useState(
    searchParams.get('pricing') || 'all'
  );
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Persisted filter state from PKV (service-specific key)
  const {
    enabledFilters,
    catalogFilters,
    loading: preferencesLoading,
    activeFilterCount: activeCatalogFilterCount,
    toggleFilter,
    removeFilter,
    clearAll,
    setCatalogFilters,
  } = useFilterPreferences({
    pkvKey: 'sme-mart.service-filters',
    localStorageKey: 'sme-mart-service-filters',
  });

  useEffect(() => {
    // Fetch services with provider catalog relationships
    fetch('/api/services?include=provider')
      .then((res) => res.json())
      .then((data) => setServices(data))
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
    let result = [...services];

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
        (s) =>
          s.title.toLowerCase().includes(q) ||
          (s.description && s.description.toLowerCase().includes(q)) ||
          s.provider.displayName.toLowerCase().includes(q)
      );
    }

    // Pricing type filter
    if (selectedPricingType !== 'all') {
      result = result.filter((s) => s.pricingType === selectedPricingType);
    }

    // Framework filter - provider must have ALL active frameworks
    if (activeFrameworks.length > 0) {
      result = result.filter((s) => {
        if (!s.provider.frameworks) return false;
        return activeFrameworks.every((fId) =>
          s.provider.frameworks!.some((f) => f.zerobiasFrameworkId === fId)
        );
      });
    }

    // Product filter - provider must have ALL active products
    if (activeProducts.length > 0) {
      result = result.filter((s) => {
        if (!s.provider.products) return false;
        return activeProducts.every((pId) =>
          s.provider.products!.some((prod) => prod.zerobiasProductId === pId)
        );
      });
    }

    // Skill filter - provider must have ALL active skills
    if (activeSkills.length > 0) {
      result = result.filter((s) => {
        if (!s.provider.skills) return false;
        return activeSkills.every((sId) =>
          s.provider.skills!.some((skill) => skill.zerobiasSkillId === sId)
        );
      });
    }

    // Role filter - provider must have ANY of the active roles
    if (activeRoles.length > 0) {
      result = result.filter((s) => {
        if (!s.provider.roles) return false;
        return activeRoles.some((rId) =>
          s.provider.roles!.some((role) => role.zerobiasRoleId === rId)
        );
      });
    }

    // Segment filter - provider must have ANY of the active segments
    if (activeSegments.length > 0) {
      result = result.filter((s) => {
        if (!s.provider.segments) return false;
        return activeSegments.some((sId) =>
          s.provider.segments!.some((seg) => seg.zerobiasSegmentId === sId)
        );
      });
    }

    // Service segment filter - service category must match
    if (activeServiceSegments.length > 0) {
      result = result.filter((s) => {
        return activeServiceSegments.some((segId) =>
          s.category?.toLowerCase() === segId.toLowerCase()
        );
      });
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return (parseFloat(a.price || '0')) - (parseFloat(b.price || '0'));
        case 'price-high':
          return (parseFloat(b.price || '0')) - (parseFloat(a.price || '0'));
        case 'newest':
        default:
          return 0; // API returns newest first
      }
    });

    return result;
  }, [services, searchQuery, selectedPricingType, sortBy, catalogFilters]);

  const filterPanel = (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <FilterEnabler
        enabledFilters={enabledFilters}
        onToggleFilter={handleToggleFilter}
        onClearAll={handleClearAll}
        activeFilterCount={activeCatalogFilterCount}
      />
      <CatalogFilters
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
        Service Catalog
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Browse productized compliance services from vetted experts
      </Typography>

      {/* Search Bar + Sort + Pricing + Mobile Filter Toggle */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          sx={{ flex: 1, minWidth: 200 }}
          placeholder="Search by service name, description, or provider..."
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

        {/* Pricing Type Filter */}
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Pricing</InputLabel>
          <Select
            value={selectedPricingType}
            label="Pricing"
            onChange={(e) => setSelectedPricingType(e.target.value)}
          >
            <MenuItem value="all">All Types</MenuItem>
            <MenuItem value="fixed">Fixed Price</MenuItem>
            <MenuItem value="hourly">Hourly</MenuItem>
            <MenuItem value="subscription">Subscription</MenuItem>
            <MenuItem value="custom">Custom</MenuItem>
          </Select>
        </FormControl>

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
            Showing {filtered.length} service{filtered.length !== 1 ? 's' : ''}
            {activeCatalogFilterCount > 0 && ` (${activeCatalogFilterCount} filters applied)`}
          </Typography>

          {/* Results */}
          {loading || preferencesLoading ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <CircularProgress size={40} />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ my: 4 }}>
              Failed to load services. Please try again later.
            </Alert>
          ) : filtered.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No services match your filters
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try adjusting your search or filters to find what you&apos;re looking for.
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {filtered.map((service) => (
                <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={service.id}>
                  <ServiceCard service={service} />
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
