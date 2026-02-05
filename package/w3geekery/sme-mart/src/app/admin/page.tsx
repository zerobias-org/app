'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Rating,
  Collapse,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Checkbox,
  Tooltip,
  CircularProgress,
  Snackbar,
} from '@mui/material';
import {
  People as PeopleIcon,
  Settings as SettingsIcon,
  Business as BusinessIcon,
  Security as SecurityIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon,
  Category as CategoryIcon,
  RateReview as ReviewIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
  DragIndicator as DragIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useZeroBias } from '@/context/ZeroBiasContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

// --- Types ---

interface AdminStats {
  totalProviders: number;
  totalCategories: number;
  pendingReviews: number;
}

interface ProviderProfile {
  id: string;
  displayName: string;
  zerobiasUserId: string;
  slug: string;
  headline: string | null;
  hourlyRate: string | null;
  availabilityStatus: string;
  ratingAverage: string | null;
  createdAt: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  icon: string | null;
  sortOrder: number;
}

interface CategoryTree extends Category {
  children: Category[];
}

interface ReviewData {
  id: string;
  providerId: string;
  reviewerZerobiasUserId: string;
  rating: number;
  reviewText: string | null;
  approved: boolean;
  approvedAt: string | null;
  approvedBy: string | null;
  createdAt: string;
  provider: {
    id: string;
    displayName: string;
    slug: string;
  };
}

interface AppSetting {
  key: string;
  value: unknown;
  description: string | null;
  category: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
}

// Mock orgs — ZeroBias org data requires platform SDK (future: org_profiles table)
const mockOrgs = [
  { id: '1', name: 'Acme Corp', users: 25, plan: 'Enterprise', status: 'Active' },
  { id: '2', name: 'TechStart Inc', users: 10, plan: 'Professional', status: 'Active' },
  { id: '3', name: 'SecureData LLC', users: 5, plan: 'Starter', status: 'Trial' },
];

/** Build tree from flat categories list */
function buildCategoryTree(flat: Category[]): CategoryTree[] {
  const topLevel = flat.filter(c => !c.parentId);
  return topLevel.map(parent => ({
    ...parent,
    children: flat.filter(c => c.parentId === parent.id),
  }));
}

export default function AdminPage() {
  const router = useRouter();
  const { user, isAdmin, loading } = useZeroBias();
  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState('');

  // Admin auth header for all /api/admin/* calls
  const adminHeaders = useMemo(() => ({
    'x-zerobias-user-id': user?.id || '',
  }), [user?.id]);

  // --- Data state ---
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [categoriesFlat, setCategoriesFlat] = useState<Category[]>([]);
  const [reviewsList, setReviewsList] = useState<ReviewData[]>([]);
  const [settingsList, setSettingsList] = useState<AppSetting[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  // --- Search / filter state ---
  const [searchQuery, setSearchQuery] = useState('');
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [reviewSearchQuery, setReviewSearchQuery] = useState('');
  const [reviewStatusFilter, setReviewStatusFilter] = useState<string>('all');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedReviews, setSelectedReviews] = useState<Set<string>>(new Set());

  // Category dialog state
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    slug: '',
    description: '',
    parentId: '' as string | null,
    icon: '',
    sortOrder: 0,
  });
  const [savingCategory, setSavingCategory] = useState(false);

  // Review detail dialog state
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<ReviewData | null>(null);
  const [updatingReview, setUpdatingReview] = useState(false);

  // --- Data fetching ---
  const fetchStats = useCallback(() => {
    fetch('/api/admin/stats', { headers: adminHeaders })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setStats(data); })
      .catch(() => {});
  }, [adminHeaders]);

  const fetchProviders = useCallback(() => {
    fetch('/api/providers')
      .then(r => r.ok ? r.json() : [])
      .then(data => setProviders(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const fetchCategories = useCallback(() => {
    fetch('/api/admin/categories', { headers: adminHeaders })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        setCategoriesFlat(Array.isArray(data) ? data : []);
        // Auto-expand first 3 top-level categories
        const topLevel = (data as Category[]).filter(c => !c.parentId).slice(0, 3);
        setExpandedCategories(prev => {
          if (prev.size === 0) return new Set(topLevel.map(c => c.id));
          return prev;
        });
      })
      .catch(() => {});
  }, [adminHeaders]);

  const fetchReviews = useCallback(() => {
    fetch('/api/admin/reviews', { headers: adminHeaders })
      .then(r => r.ok ? r.json() : [])
      .then(data => setReviewsList(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [adminHeaders]);

  const fetchSettings = useCallback(() => {
    fetch('/api/admin/settings', { headers: adminHeaders })
      .then(r => r.ok ? r.json() : [])
      .then(data => setSettingsList(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [adminHeaders]);

  useEffect(() => {
    if (!user?.id) return;
    const h = { 'x-zerobias-user-id': user.id };
    Promise.all([
      fetch('/api/admin/stats', { headers: h }).then(r => r.ok ? r.json() : null),
      fetch('/api/providers').then(r => r.ok ? r.json() : []),
      fetch('/api/admin/categories', { headers: h }).then(r => r.ok ? r.json() : []),
      fetch('/api/admin/reviews', { headers: h }).then(r => r.ok ? r.json() : []),
      fetch('/api/admin/settings', { headers: h }).then(r => r.ok ? r.json() : []),
    ]).then(([statsData, providersData, categoriesData, reviewsData, settingsData]) => {
      if (statsData) setStats(statsData);
      setProviders(Array.isArray(providersData) ? providersData : []);
      const cats = Array.isArray(categoriesData) ? categoriesData : [];
      setCategoriesFlat(cats);
      const topLevel = cats.filter((c: Category) => !c.parentId).slice(0, 3);
      setExpandedCategories(new Set(topLevel.map((c: Category) => c.id)));
      setReviewsList(Array.isArray(reviewsData) ? reviewsData : []);
      setSettingsList(Array.isArray(settingsData) ? settingsData : []);
    }).catch(() => {}).finally(() => setLoadingData(false));
  }, [user?.id]);

  // --- Derived data ---
  const categoryTree = buildCategoryTree(categoriesFlat);
  const topLevelCategories = categoriesFlat.filter(c => !c.parentId);

  const filteredProviders = providers.filter(p =>
    p.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.zerobiasUserId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredReviews = reviewsList.filter(review => {
    const providerName = review.provider?.displayName || '';
    const matchesSearch = providerName.toLowerCase().includes(reviewSearchQuery.toLowerCase()) ||
      review.reviewerZerobiasUserId.toLowerCase().includes(reviewSearchQuery.toLowerCase()) ||
      (review.reviewText || '').toLowerCase().includes(reviewSearchQuery.toLowerCase());
    const status = review.approved ? 'approved' : (review.approvedBy ? 'rejected' : 'pending');
    const matchesStatus = reviewStatusFilter === 'all' || status === reviewStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingReviewsCount = stats?.pendingReviews ?? reviewsList.filter(r => !r.approvedBy).length;

  // --- Loading / Auth guard ---
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  if (!user || !isAdmin) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          Access denied. You must be an administrator to view this page.
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/')}
          sx={{ mt: 2 }}
        >
          Return to Home
        </Button>
      </Container>
    );
  }

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // --- Category handlers ---
  const toggleCategoryExpand = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleAddCategory = (parentId: string | null = null) => {
    setEditingCategory(null);
    setCategoryForm({ name: '', slug: '', description: '', parentId, icon: '', sortOrder: 0 });
    setCategoryDialogOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      parentId: category.parentId,
      icon: category.icon || '',
      sortOrder: category.sortOrder,
    });
    setCategoryDialogOpen(true);
  };

  const handleSaveCategory = async () => {
    setSavingCategory(true);
    try {
      const url = editingCategory
        ? `/api/admin/categories/${editingCategory.id}`
        : '/api/admin/categories';
      const method = editingCategory ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...adminHeaders },
        body: JSON.stringify({
          name: categoryForm.name,
          slug: categoryForm.slug || undefined,
          description: categoryForm.description || null,
          parentId: categoryForm.parentId || null,
          icon: categoryForm.icon || null,
          sortOrder: categoryForm.sortOrder,
        }),
      });

      if (res.ok) {
        setCategoryDialogOpen(false);
        setSnackbar(editingCategory ? 'Category updated' : 'Category created');
        fetchCategories();
        fetchStats();
      } else {
        const data = await res.json();
        setSnackbar(data.error || 'Failed to save category');
      }
    } catch {
      setSnackbar('Failed to save category');
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Delete this category and all its subcategories?')) return;
    try {
      const res = await fetch(`/api/admin/categories/${categoryId}`, { method: 'DELETE', headers: adminHeaders });
      if (res.ok) {
        setSnackbar('Category deleted');
        fetchCategories();
        fetchStats();
      } else {
        setSnackbar('Failed to delete category');
      }
    } catch {
      setSnackbar('Failed to delete category');
    }
  };

  // --- Review handlers ---
  const handleViewReview = (review: ReviewData) => {
    setSelectedReview(review);
    setReviewDialogOpen(true);
  };

  const handleReviewAction = async (reviewIds: string[], action: 'approve' | 'reject') => {
    setUpdatingReview(true);
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...adminHeaders },
        body: JSON.stringify({ reviewIds, action, approvedBy: user!.id }),
      });
      if (res.ok) {
        setSnackbar(`${reviewIds.length} review(s) ${action === 'approve' ? 'approved' : 'rejected'}`);
        setSelectedReviews(new Set());
        setReviewDialogOpen(false);
        fetchReviews();
        fetchStats();
      } else {
        setSnackbar(`Failed to ${action} review(s)`);
      }
    } catch {
      setSnackbar(`Failed to ${action} review(s)`);
    } finally {
      setUpdatingReview(false);
    }
  };

  const toggleReviewSelection = (reviewId: string) => {
    setSelectedReviews(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reviewId)) {
        newSet.delete(reviewId);
      } else {
        newSet.add(reviewId);
      }
      return newSet;
    });
  };

  const getReviewStatus = (review: ReviewData): 'approved' | 'rejected' | 'pending' => {
    if (review.approved) return 'approved';
    if (review.approvedBy) return 'rejected';
    return 'pending';
  };

  // --- Settings helpers ---
  const getSettingValue = <T,>(key: string, defaultValue: T): T => {
    const setting = settingsList.find(s => s.key === key);
    if (!setting) return defaultValue;
    return setting.value as T;
  };

  const handleSettingChange = (key: string, value: unknown) => {
    setSettingsList(prev => {
      const existing = prev.find(s => s.key === key);
      if (existing) {
        return prev.map(s => s.key === key ? { ...s, value } : s);
      }
      return [...prev, { key, value, description: null, category: null, updatedAt: null, updatedBy: null }];
    });
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...adminHeaders },
        body: JSON.stringify({ settings: settingsList.map(s => ({ key: s.key, value: s.value })) }),
      });
      if (res.ok) {
        setSnackbar('Settings saved successfully');
        fetchSettings();
      } else {
        setSnackbar('Failed to save settings');
      }
    } catch {
      setSnackbar('Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.back()}
          sx={{ mb: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4" fontWeight={600}>
          App Administration
        </Typography>
        <Typography color="text.secondary">
          Manage users, organizations, categories, reviews, and application settings
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'primary.light', color: 'white', display: 'flex' }}>
                  <PeopleIcon fontSize="small" />
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: 32 }}>
                  <Typography component="span" variant="h6" fontWeight={600} sx={{ lineHeight: 1.2 }}>
                    {loadingData ? '—' : (stats?.totalProviders ?? providers.length)}
                  </Typography>
                  <Typography component="span" variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>Providers</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'success.light', color: 'white', display: 'flex' }}>
                  <CategoryIcon fontSize="small" />
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: 32 }}>
                  <Typography component="span" variant="h6" fontWeight={600} sx={{ lineHeight: 1.2 }}>
                    {loadingData ? '—' : (stats?.totalCategories ?? categoriesFlat.length)}
                  </Typography>
                  <Typography component="span" variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>Categories</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'warning.light', color: 'white', display: 'flex' }}>
                  <SecurityIcon fontSize="small" />
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: 32 }}>
                  <Typography component="span" variant="h6" fontWeight={600} sx={{ lineHeight: 1.2 }}>
                    {loadingData ? '—' : providers.length}
                  </Typography>
                  <Typography component="span" variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>SME Providers</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'info.light', color: 'white', display: 'flex' }}>
                  <ReviewIcon fontSize="small" />
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: 32 }}>
                  <Typography component="span" variant="h6" fontWeight={600} sx={{ lineHeight: 1.2 }}>
                    {loadingData ? '—' : pendingReviewsCount}
                  </Typography>
                  <Typography component="span" variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>Pending Reviews</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {loadingData && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress size={32} />
        </Box>
      )}

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
            <Tab icon={<PeopleIcon />} label="Users" iconPosition="start" />
            <Tab icon={<BusinessIcon />} label="Organizations" iconPosition="start" />
            <Tab icon={<CategoryIcon />} label="Categories" iconPosition="start" />
            <Tab
              icon={<ReviewIcon />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Reviews
                  {pendingReviewsCount > 0 && (
                    <Chip size="small" label={pendingReviewsCount} color="warning" sx={{ height: 20 }} />
                  )}
                </Box>
              }
              iconPosition="start"
            />
            <Tab icon={<SettingsIcon />} label="Settings" iconPosition="start" />
          </Tabs>
        </Box>

        {/* Users Tab — Real provider data */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ px: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <TextField
                size="small"
                placeholder="Search providers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ width: 300 }}
              />
              <Button startIcon={<RefreshIcon />} variant="outlined" onClick={fetchProviders}>
                Refresh
              </Button>
            </Box>

            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>ZeroBias User ID</TableCell>
                    <TableCell>Headline</TableCell>
                    <TableCell>Rate</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Rating</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredProviders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                        <Typography color="text.secondary">
                          {loadingData ? 'Loading providers...' : 'No providers found.'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProviders.map((provider) => (
                      <TableRow key={provider.id}>
                        <TableCell>{provider.displayName}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                            {provider.zerobiasUserId}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ maxWidth: 200 }}>
                          <Typography variant="body2" noWrap>{provider.headline || '—'}</Typography>
                        </TableCell>
                        <TableCell>{provider.hourlyRate ? `$${provider.hourlyRate}/hr` : '—'}</TableCell>
                        <TableCell>
                          <Chip
                            label={provider.availabilityStatus}
                            size="small"
                            color={provider.availabilityStatus === 'available' ? 'success' : provider.availabilityStatus === 'busy' ? 'warning' : 'default'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          {provider.ratingAverage ? (
                            <Rating value={parseFloat(provider.ratingAverage)} readOnly size="small" precision={0.1} />
                          ) : '—'}
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="View profile">
                            <IconButton size="small" onClick={() => router.push(`/providers/${provider.slug}`)}>
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>

        {/* Organizations Tab — Mock data (future: org_profiles table) */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ px: 3 }}>
            <Alert severity="info" sx={{ mb: 3 }}>
              Organization data comes from the ZeroBias platform. A marketplace-specific org_profiles table will be added in a future phase.
            </Alert>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <TextField
                size="small"
                placeholder="Search organizations..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ width: 300 }}
              />
              <Button startIcon={<AddIcon />} variant="contained" disabled>
                Add Organization
              </Button>
            </Box>

            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Organization</TableCell>
                    <TableCell>Users</TableCell>
                    <TableCell>Plan</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mockOrgs.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.users}</TableCell>
                      <TableCell>
                        <Chip
                          label={row.plan}
                          size="small"
                          color={row.plan === 'Enterprise' ? 'primary' : row.plan === 'Professional' ? 'secondary' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={row.status}
                          size="small"
                          color={row.status === 'Active' ? 'success' : 'warning'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" disabled>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>

        {/* Categories Tab — Real data */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ px: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <TextField
                size="small"
                placeholder="Search categories..."
                value={categorySearchQuery}
                onChange={(e) => setCategorySearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ width: 300 }}
              />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button startIcon={<RefreshIcon />} variant="outlined" onClick={fetchCategories}>
                  Refresh
                </Button>
                <Button startIcon={<AddIcon />} variant="contained" onClick={() => handleAddCategory(null)}>
                  Add Category
                </Button>
              </Box>
            </Box>

            <Paper variant="outlined">
              <List disablePadding>
                {categoryTree.length === 0 ? (
                  <ListItem>
                    <ListItemText
                      primary={
                        <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                          {loadingData ? 'Loading categories...' : 'No categories found. Add one to get started.'}
                        </Typography>
                      }
                    />
                  </ListItem>
                ) : (
                  categoryTree
                    .filter(cat =>
                      cat.name.toLowerCase().includes(categorySearchQuery.toLowerCase()) ||
                      cat.children.some(child => child.name.toLowerCase().includes(categorySearchQuery.toLowerCase()))
                    )
                    .map((category) => (
                    <Box key={category.id}>
                      <ListItem
                        disablePadding
                        secondaryAction={
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title="Add subcategory">
                              <IconButton size="small" onClick={() => handleAddCategory(category.id)}>
                                <AddIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit">
                              <IconButton size="small" onClick={() => handleEditCategory(category)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton size="small" color="error" onClick={() => handleDeleteCategory(category.id)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Drag to reorder">
                              <IconButton size="small" sx={{ cursor: 'grab' }}>
                                <DragIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        }
                      >
                        <ListItemButton onClick={() => toggleCategoryExpand(category.id)}>
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            {expandedCategories.has(category.id) ? <FolderOpenIcon color="primary" /> : <FolderIcon />}
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography fontWeight={600}>{category.name}</Typography>
                                <Chip size="small" label={`${category.children.length} subcategories`} variant="outlined" />
                              </Box>
                            }
                            secondary={category.description}
                          />
                          {category.children.length > 0 && (
                            expandedCategories.has(category.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />
                          )}
                        </ListItemButton>
                      </ListItem>

                      {category.children.length > 0 && (
                        <Collapse in={expandedCategories.has(category.id)}>
                          <List disablePadding sx={{ pl: 4, bgcolor: 'action.hover' }}>
                            {category.children
                              .filter(child =>
                                categorySearchQuery === '' ||
                                child.name.toLowerCase().includes(categorySearchQuery.toLowerCase())
                              )
                              .map((child) => (
                              <ListItem
                                key={child.id}
                                disablePadding
                                secondaryAction={
                                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                                    <Tooltip title="Edit">
                                      <IconButton size="small" onClick={() => handleEditCategory(child)}>
                                        <EditIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete">
                                      <IconButton size="small" color="error" onClick={() => handleDeleteCategory(child.id)}>
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Drag to reorder">
                                      <IconButton size="small" sx={{ cursor: 'grab' }}>
                                        <DragIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                }
                              >
                                <ListItemButton sx={{ pl: 2 }}>
                                  <ListItemText
                                    primary={child.name}
                                    secondary={child.description}
                                  />
                                </ListItemButton>
                              </ListItem>
                            ))}
                          </List>
                        </Collapse>
                      )}
                      <Divider />
                    </Box>
                  ))
                )}
              </List>
            </Paper>
          </Box>
        </TabPanel>

        {/* Reviews Tab — Real data */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ px: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <TextField
                  size="small"
                  placeholder="Search reviews..."
                  value={reviewSearchQuery}
                  onChange={(e) => setReviewSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ width: 250 }}
                />
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={reviewStatusFilter}
                    label="Status"
                    onChange={(e) => setReviewStatusFilter(e.target.value)}
                  >
                    <MenuItem value="all">All Reviews</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="approved">Approved</MenuItem>
                    <MenuItem value="rejected">Rejected</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {selectedReviews.size > 0 && (
                  <>
                    <Button
                      startIcon={<ApproveIcon />}
                      variant="contained"
                      color="success"
                      onClick={() => handleReviewAction(Array.from(selectedReviews), 'approve')}
                      disabled={updatingReview}
                    >
                      Approve ({selectedReviews.size})
                    </Button>
                    <Button
                      startIcon={<RejectIcon />}
                      variant="outlined"
                      color="error"
                      onClick={() => handleReviewAction(Array.from(selectedReviews), 'reject')}
                      disabled={updatingReview}
                    >
                      Reject ({selectedReviews.size})
                    </Button>
                  </>
                )}
                <Button startIcon={<RefreshIcon />} variant="outlined" onClick={fetchReviews}>
                  Refresh
                </Button>
              </Box>
            </Box>

            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        indeterminate={selectedReviews.size > 0 && selectedReviews.size < filteredReviews.length}
                        checked={selectedReviews.size === filteredReviews.length && filteredReviews.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedReviews(new Set(filteredReviews.map(r => r.id)));
                          } else {
                            setSelectedReviews(new Set());
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>Provider</TableCell>
                    <TableCell>Reviewer</TableCell>
                    <TableCell>Rating</TableCell>
                    <TableCell>Review</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredReviews.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                        <Typography color="text.secondary">
                          {loadingData ? 'Loading reviews...' : 'No reviews found.'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredReviews.map((review) => {
                      const status = getReviewStatus(review);
                      return (
                        <TableRow key={review.id} selected={selectedReviews.has(review.id)}>
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={selectedReviews.has(review.id)}
                              onChange={() => toggleReviewSelection(review.id)}
                            />
                          </TableCell>
                          <TableCell>{review.provider?.displayName || '—'}</TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                              {review.reviewerZerobiasUserId}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Rating value={review.rating} readOnly size="small" />
                          </TableCell>
                          <TableCell sx={{ maxWidth: 250 }}>
                            <Typography variant="body2" noWrap title={review.reviewText || ''}>
                              {review.reviewText || '—'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={status}
                              size="small"
                              color={status === 'approved' ? 'success' : status === 'rejected' ? 'error' : 'warning'}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>{new Date(review.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell align="right">
                            <Tooltip title="View details">
                              <IconButton size="small" onClick={() => handleViewReview(review)}>
                                <ViewIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {status === 'pending' && (
                              <>
                                <Tooltip title="Approve">
                                  <IconButton
                                    size="small"
                                    color="success"
                                    onClick={() => handleReviewAction([review.id], 'approve')}
                                    disabled={updatingReview}
                                  >
                                    <ApproveIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Reject">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleReviewAction([review.id], 'reject')}
                                    disabled={updatingReview}
                                  >
                                    <RejectIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>

        {/* Settings Tab — Persisted to app_settings table */}
        <TabPanel value={tabValue} index={4}>
          <Box sx={{ px: 3 }}>
            {settingsList.length === 0 && !loadingData && (
              <Alert severity="info" sx={{ mb: 3 }}>
                No settings found. Run <code>npm run db:seed</code> to populate default settings.
              </Alert>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Application Settings
              </Typography>
              <Button startIcon={<RefreshIcon />} variant="outlined" size="small" onClick={fetchSettings}>
                Refresh
              </Button>
            </Box>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              {/* Registration Settings */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      Registration
                    </Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={getSettingValue('registration.allowNewUsers', true)}
                          onChange={(e) => handleSettingChange('registration.allowNewUsers', e.target.checked)}
                        />
                      }
                      label="Allow new user registration"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={getSettingValue('registration.requireEmailVerification', true)}
                          onChange={(e) => handleSettingChange('registration.requireEmailVerification', e.target.checked)}
                        />
                      }
                      label="Require email verification"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={getSettingValue('registration.requireAdminApproval', false)}
                          onChange={(e) => handleSettingChange('registration.requireAdminApproval', e.target.checked)}
                        />
                      }
                      label="Require admin approval for providers"
                    />
                  </CardContent>
                </Card>
              </Grid>

              {/* Notification Settings */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      Notifications
                    </Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={getSettingValue('notifications.emailEnabled', true)}
                          onChange={(e) => handleSettingChange('notifications.emailEnabled', e.target.checked)}
                        />
                      }
                      label="Send email notifications"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={getSettingValue('notifications.newUserAlerts', true)}
                          onChange={(e) => handleSettingChange('notifications.newUserAlerts', e.target.checked)}
                        />
                      }
                      label="New user alerts"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={getSettingValue('notifications.weeklyDigest', false)}
                          onChange={(e) => handleSettingChange('notifications.weeklyDigest', e.target.checked)}
                        />
                      }
                      label="Weekly digest"
                    />
                  </CardContent>
                </Card>
              </Grid>

              {/* Security Settings */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      Security
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      These settings are informational — actual enforcement is handled by ZeroBias platform.
                    </Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={getSettingValue('security.enforce2FAForAdmins', true)}
                          onChange={(e) => handleSettingChange('security.enforce2FAForAdmins', e.target.checked)}
                        />
                      }
                      label="Enforce 2FA for admins"
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                      <Typography variant="body2">Session timeout:</Typography>
                      <TextField
                        size="small"
                        type="number"
                        value={getSettingValue('security.sessionTimeoutMinutes', 30)}
                        onChange={(e) => handleSettingChange('security.sessionTimeoutMinutes', parseInt(e.target.value) || 30)}
                        sx={{ width: 80 }}
                        InputProps={{ endAdornment: <Typography variant="caption">min</Typography> }}
                      />
                    </Box>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={getSettingValue('security.ipAllowlistEnabled', false)}
                          onChange={(e) => handleSettingChange('security.ipAllowlistEnabled', e.target.checked)}
                        />
                      }
                      label="IP allowlisting"
                    />
                  </CardContent>
                </Card>
              </Grid>

              {/* Marketplace Settings */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      Marketplace
                    </Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={getSettingValue('marketplace.enabled', true)}
                          onChange={(e) => handleSettingChange('marketplace.enabled', e.target.checked)}
                        />
                      }
                      label="Enable marketplace"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={getSettingValue('marketplace.allowReviews', true)}
                          onChange={(e) => handleSettingChange('marketplace.allowReviews', e.target.checked)}
                        />
                      }
                      label="Allow reviews"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={getSettingValue('marketplace.autoApproveReviews', false)}
                          onChange={(e) => handleSettingChange('marketplace.autoApproveReviews', e.target.checked)}
                        />
                      }
                      label="Auto-approve reviews"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={getSettingValue('marketplace.requireVerificationBadge', false)}
                          onChange={(e) => handleSettingChange('marketplace.requireVerificationBadge', e.target.checked)}
                        />
                      }
                      label="Require verification badge"
                    />
                    <Divider sx={{ my: 1.5 }} />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                      <Typography variant="body2">Max hourly rate:</Typography>
                      <TextField
                        size="small"
                        type="number"
                        value={getSettingValue('marketplace.maxHourlyRate', 500)}
                        onChange={(e) => handleSettingChange('marketplace.maxHourlyRate', parseInt(e.target.value) || 500)}
                        sx={{ width: 100 }}
                        InputProps={{ startAdornment: <Typography variant="caption">$</Typography> }}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="body2">Max budget:</Typography>
                      <TextField
                        size="small"
                        type="number"
                        value={getSettingValue('marketplace.maxBudget', 100000)}
                        onChange={(e) => handleSettingChange('marketplace.maxBudget', parseInt(e.target.value) || 100000)}
                        sx={{ width: 120 }}
                        InputProps={{ startAdornment: <Typography variant="caption">$</Typography> }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button variant="outlined" onClick={fetchSettings} disabled={savingSettings}>
                Reset
              </Button>
              <Button
                variant="contained"
                onClick={handleSaveSettings}
                disabled={savingSettings || settingsList.length === 0}
              >
                {savingSettings ? 'Saving...' : 'Save Settings'}
              </Button>
            </Box>
          </Box>
        </TabPanel>
      </Card>

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onClose={() => setCategoryDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Name"
              fullWidth
              value={categoryForm.name}
              onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
            />
            <TextField
              label="Slug"
              fullWidth
              value={categoryForm.slug}
              onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
              helperText="URL-friendly identifier (e.g., soc2-assessors). Auto-generated if empty."
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={2}
              value={categoryForm.description}
              onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>Parent Category</InputLabel>
              <Select
                value={categoryForm.parentId || ''}
                label="Parent Category"
                onChange={(e) => setCategoryForm({ ...categoryForm, parentId: e.target.value || null })}
              >
                <MenuItem value="">None (Top Level)</MenuItem>
                {topLevelCategories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Icon"
              fullWidth
              value={categoryForm.icon}
              onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
              helperText="Material icon name (e.g., security, assessment)"
            />
            <TextField
              label="Sort Order"
              type="number"
              fullWidth
              value={categoryForm.sortOrder}
              onChange={(e) => setCategoryForm({ ...categoryForm, sortOrder: parseInt(e.target.value) || 0 })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCategoryDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveCategory} variant="contained" disabled={savingCategory || !categoryForm.name}>
            {savingCategory ? 'Saving...' : (editingCategory ? 'Save Changes' : 'Add Category')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Review Detail Dialog */}
      <Dialog open={reviewDialogOpen} onClose={() => setReviewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Review Details</DialogTitle>
        <DialogContent>
          {selectedReview && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">Provider</Typography>
                <Typography fontWeight={500}>{selectedReview.provider?.displayName || '—'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Reviewer</Typography>
                <Typography fontWeight={500}>{selectedReview.reviewerZerobiasUserId}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Rating</Typography>
                <Rating value={selectedReview.rating} readOnly />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Review Text</Typography>
                <Typography>{selectedReview.reviewText || '—'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Status</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={getReviewStatus(selectedReview)}
                    color={getReviewStatus(selectedReview) === 'approved' ? 'success' : getReviewStatus(selectedReview) === 'rejected' ? 'error' : 'warning'}
                    variant="outlined"
                  />
                </Box>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Submitted</Typography>
                <Typography>{new Date(selectedReview.createdAt).toLocaleDateString()}</Typography>
              </Box>
              {selectedReview.approvedAt && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {selectedReview.approved ? 'Approved' : 'Rejected'}
                  </Typography>
                  <Typography>
                    {new Date(selectedReview.approvedAt).toLocaleDateString()} by {selectedReview.approvedBy}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {selectedReview && getReviewStatus(selectedReview) === 'pending' && (
            <>
              <Button
                onClick={() => handleReviewAction([selectedReview.id], 'reject')}
                color="error"
                disabled={updatingReview}
              >
                Reject
              </Button>
              <Button
                onClick={() => handleReviewAction([selectedReview.id], 'approve')}
                variant="contained"
                color="success"
                disabled={updatingReview}
              >
                Approve
              </Button>
            </>
          )}
          <Button onClick={() => setReviewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!snackbar}
        autoHideDuration={3000}
        onClose={() => setSnackbar('')}
        message={snackbar}
      />
    </Container>
  );
}
