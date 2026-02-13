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
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
} from '@mui/material';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import Link from 'next/link';
import { EngagementCard, type EngagementCardData } from '@/components/marketplace/EngagementCard';
import { CatalogFilters, getActiveFilters } from '@/components/marketplace/ProviderFilters';
import { FilterEnabler, type FilterType } from '@/components/marketplace/FilterEnabler';
import { useFilterPreferences } from '@/hooks/useFilterPreferences';
import { useZeroBias } from '@/context/ZeroBiasContext';
import { isRfpPhase, isEngagementPhase } from '@/lib/engagement-lifecycle';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'draft', label: 'Draft' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

type SortOption = 'newest' | 'budget-high';
type LifecycleFilter = 'rfp' | 'engagement' | 'all';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'budget-high', label: 'Budget: High to Low' },
];

const PAGE_HEADERS: Record<LifecycleFilter, { title: string; subtitle: string }> = {
  rfp: {
    title: 'Open RFPs',
    subtitle: 'Browse RFPs seeking proposals',
  },
  engagement: {
    title: 'My Engagements',
    subtitle: 'Active and completed engagements',
  },
  all: {
    title: 'All',
    subtitle: 'All your RFPs and engagements',
  },
};

const FILTER_DRAWER_WIDTH = 320;

export default function EngagementsPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useZeroBias();

  const [engagements, setEngagements] = useState<EngagementCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Filter drawer state (mobile)
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Basic filter state (not persisted)
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Lifecycle filter: RFPs | Engagements | All
  const [lifecycleFilter, setLifecycleFilter] = useState<LifecycleFilter>('rfp');

  // Provider "My Proposals" filter
  const [currentProviderId, setCurrentProviderId] = useState<string | null>(null);
  const [myProposalsOnly, setMyProposalsOnly] = useState(false);

  // Persisted catalog filter state from PKV
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
    pkvKey: 'sme-mart.engagement-filters',
    localStorageKey: 'sme-mart-engagement-filters',
  });

  useEffect(() => {
    if (!user) return;
    const url = `/api/engagements?userId=${encodeURIComponent(user.id)}`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => setEngagements(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [user]);

  // Look up current user's provider profile (for "My Proposals" filter)
  useEffect(() => {
    if (!user) return;
    fetch(`/api/profile?zerobiasUserId=${user.id}&lookup=true`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setCurrentProviderId(data.id);
      })
      .catch(() => { /* not a provider */ });
  }, [user]);

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
    let result = [...engagements];

    // Lifecycle filter (RFP / Engagement / All)
    if (lifecycleFilter === 'rfp') {
      result = result.filter((e) => isRfpPhase(e.engagementTag));
    } else if (lifecycleFilter === 'engagement') {
      result = result.filter((e) => isEngagementPhase(e.engagementTag));
    }

    // Provider "My Proposals" filter
    if (myProposalsOnly && currentProviderId) {
      result = result.filter((e) =>
        e.proposals?.some((p) => p.providerId === currentProviderId)
      );
    }

    // Get active catalog filters
    const activeServiceSegments = getActiveFilters(catalogFilters.serviceSegments);

    // Text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          (e.description && e.description.toLowerCase().includes(q))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((e) => e.status === statusFilter);
    }

    // Service segment filter - match engagement category against active service segments
    if (activeServiceSegments.length > 0) {
      result = result.filter((e) =>
        activeServiceSegments.some((segId) =>
          e.category?.toLowerCase() === segId.toLowerCase()
        )
      );
    }

    // Sort
    if (sortBy === 'budget-high') {
      result.sort((a, b) =>
        (parseFloat(b.budgetMax || b.budgetMin || '0')) - (parseFloat(a.budgetMax || a.budgetMin || '0'))
      );
    }
    // 'newest' is default from API

    return result;
  }, [engagements, searchQuery, statusFilter, sortBy, catalogFilters, lifecycleFilter, myProposalsOnly, currentProviderId]);

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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={600} gutterBottom>
            {PAGE_HEADERS[lifecycleFilter].title}
          </Typography>
          <Typography color="text.secondary">
            {PAGE_HEADERS[lifecycleFilter].subtitle}
          </Typography>
        </Box>
        <Tooltip title="Request for Proposal" enterDelay={300} arrow>
          <Button
            component={Link}
            href="/engagements/new"
            variant="contained"
            size="large"
            sx={{ flexShrink: 0 }}
          >
            Post an RFP
          </Button>
        </Tooltip>
      </Box>

      {/* Lifecycle Toggle + My Proposals */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <ToggleButtonGroup
          value={lifecycleFilter}
          exclusive
          onChange={(_, val) => { if (val) setLifecycleFilter(val); }}
          size="small"
        >
          <Tooltip title="Request for Proposal" enterDelay={300} arrow>
            <ToggleButton value="rfp">RFPs</ToggleButton>
          </Tooltip>
          {engagements.some((e) => !!e.engagementTag) && (
            <ToggleButton value="engagement">Engagements</ToggleButton>
          )}
          <ToggleButton value="all">All</ToggleButton>
        </ToggleButtonGroup>

        {/* Provider "My Proposals" toggle */}
        {currentProviderId && (
          <Chip
            label="My Proposals"
            color={myProposalsOnly ? 'primary' : 'default'}
            variant={myProposalsOnly ? 'filled' : 'outlined'}
            onClick={() => setMyProposalsOnly(!myProposalsOnly)}
            size="small"
            sx={{ cursor: 'pointer' }}
          />
        )}
      </Box>

      {/* Search Bar + Status + Sort + Mobile Filter Toggle */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          sx={{ flex: 1, minWidth: 200 }}
          placeholder="Search by title or description..."
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

        {/* Status Filter */}
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {STATUS_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
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
            Showing {filtered.length} {lifecycleFilter === 'rfp' ? 'RFP' : lifecycleFilter === 'engagement' ? 'engagement' : 'item'}{filtered.length !== 1 ? 's' : ''}
            {myProposalsOnly && ' (my proposals)'}
            {activeCatalogFilterCount > 0 && ` (${activeCatalogFilterCount} filters applied)`}
          </Typography>

          {/* Results */}
          {loading || preferencesLoading ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <CircularProgress size={40} />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ my: 4 }}>
              Failed to load engagements. Please try again later.
            </Alert>
          ) : filtered.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No {lifecycleFilter === 'rfp' ? 'RFPs' : lifecycleFilter === 'engagement' ? 'engagements' : 'items'} match your filters
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Try adjusting your filters, or post a new RFP.
              </Typography>
              <Tooltip title="Request for Proposal" enterDelay={300} arrow>
                <Button component={Link} href="/engagements/new" variant="outlined">
                  Post an RFP
                </Button>
              </Tooltip>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {filtered.map((engagement) => (
                <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={engagement.id}>
                  <EngagementCard engagement={engagement} currentProviderId={currentProviderId} />
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
