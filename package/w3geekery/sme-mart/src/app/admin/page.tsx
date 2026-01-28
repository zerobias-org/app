'use client';

import { useState } from 'react';
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

// Mock data for admin panels
const mockUsers = [
  { id: '1', name: 'John Smith', email: 'john@example.com', role: 'Admin', status: 'Active', lastLogin: '2024-01-15' },
  { id: '2', name: 'Jane Doe', email: 'jane@example.com', role: 'User', status: 'Active', lastLogin: '2024-01-14' },
  { id: '3', name: 'Bob Wilson', email: 'bob@example.com', role: 'User', status: 'Inactive', lastLogin: '2024-01-10' },
  { id: '4', name: 'Alice Brown', email: 'alice@example.com', role: 'Moderator', status: 'Active', lastLogin: '2024-01-15' },
];

const mockOrgs = [
  { id: '1', name: 'Acme Corp', users: 25, plan: 'Enterprise', status: 'Active' },
  { id: '2', name: 'TechStart Inc', users: 10, plan: 'Professional', status: 'Active' },
  { id: '3', name: 'SecureData LLC', users: 5, plan: 'Starter', status: 'Trial' },
];

// Mock categories with hierarchy
interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  parentId: string | null;
  icon: string;
  sortOrder: number;
  children?: Category[];
}

const mockCategories: Category[] = [
  {
    id: '1',
    name: 'Assessors',
    slug: 'assessors',
    description: 'Compliance assessment professionals',
    parentId: null,
    icon: 'assessment',
    sortOrder: 1,
    children: [
      { id: '1-1', name: 'SOC 2 Assessors', slug: 'soc2-assessors', description: 'SOC 2 audit specialists', parentId: '1', icon: 'verified', sortOrder: 1 },
      { id: '1-2', name: 'ISO 27001 Auditors', slug: 'iso27001-auditors', description: 'ISO certification auditors', parentId: '1', icon: 'verified', sortOrder: 2 },
      { id: '1-3', name: 'HITRUST Assessors', slug: 'hitrust-assessors', description: 'HITRUST certification specialists', parentId: '1', icon: 'verified', sortOrder: 3 },
      { id: '1-4', name: 'PCI-DSS QSAs', slug: 'pci-qsas', description: 'Qualified Security Assessors', parentId: '1', icon: 'verified', sortOrder: 4 },
    ],
  },
  {
    id: '2',
    name: 'Advisors',
    slug: 'advisors',
    description: 'Compliance consulting and advisory',
    parentId: null,
    icon: 'support_agent',
    sortOrder: 2,
    children: [
      { id: '2-1', name: 'GRC Consultants', slug: 'grc-consultants', description: 'Governance, Risk & Compliance experts', parentId: '2', icon: 'policy', sortOrder: 1 },
      { id: '2-2', name: 'Privacy Advisors', slug: 'privacy-advisors', description: 'Data privacy specialists', parentId: '2', icon: 'privacy_tip', sortOrder: 2 },
      { id: '2-3', name: 'Risk Analysts', slug: 'risk-analysts', description: 'Risk assessment professionals', parentId: '2', icon: 'analytics', sortOrder: 3 },
    ],
  },
  {
    id: '3',
    name: 'Agentic',
    slug: 'agentic',
    description: 'AI and automation specialists',
    parentId: null,
    icon: 'smart_toy',
    sortOrder: 3,
    children: [
      { id: '3-1', name: 'AI Agent Builders', slug: 'ai-agent-builders', description: 'Custom AI agent development', parentId: '3', icon: 'robot', sortOrder: 1 },
      { id: '3-2', name: 'Prompt Engineers', slug: 'prompt-engineers', description: 'LLM prompt optimization', parentId: '3', icon: 'code', sortOrder: 2 },
      { id: '3-3', name: 'Automation Specialists', slug: 'automation-specialists', description: 'Workflow automation experts', parentId: '3', icon: 'settings_automation', sortOrder: 3 },
    ],
  },
  {
    id: '4',
    name: 'SecOps',
    slug: 'secops',
    description: 'Security operations professionals',
    parentId: null,
    icon: 'security',
    sortOrder: 4,
    children: [
      { id: '4-1', name: 'Security Analysts', slug: 'security-analysts', description: 'Security monitoring and analysis', parentId: '4', icon: 'shield', sortOrder: 1 },
      { id: '4-2', name: 'Incident Responders', slug: 'incident-responders', description: 'Security incident response', parentId: '4', icon: 'emergency', sortOrder: 2 },
      { id: '4-3', name: 'Threat Hunters', slug: 'threat-hunters', description: 'Proactive threat detection', parentId: '4', icon: 'search', sortOrder: 3 },
    ],
  },
  {
    id: '5',
    name: 'DevSecOps',
    slug: 'devsecops',
    description: 'Security in development pipeline',
    parentId: null,
    icon: 'integration_instructions',
    sortOrder: 5,
    children: [
      { id: '5-1', name: 'Secure SDLC', slug: 'secure-sdlc', description: 'Secure development lifecycle', parentId: '5', icon: 'cycle', sortOrder: 1 },
      { id: '5-2', name: 'CI/CD Security', slug: 'cicd-security', description: 'Pipeline security specialists', parentId: '5', icon: 'loop', sortOrder: 2 },
      { id: '5-3', name: 'Container Security', slug: 'container-security', description: 'Docker/K8s security', parentId: '5', icon: 'inventory_2', sortOrder: 3 },
    ],
  },
  {
    id: '6',
    name: 'Data Services',
    slug: 'data-services',
    description: 'Data collection and documentation',
    parentId: null,
    icon: 'storage',
    sortOrder: 6,
    children: [
      { id: '6-1', name: 'Evidence Collection', slug: 'evidence-collection', description: 'Audit evidence gathering', parentId: '6', icon: 'folder', sortOrder: 1 },
      { id: '6-2', name: 'Data Entry', slug: 'data-entry', description: 'Data input specialists', parentId: '6', icon: 'keyboard', sortOrder: 2 },
      { id: '6-3', name: 'Documentation', slug: 'documentation', description: 'Policy and procedure documentation', parentId: '6', icon: 'description', sortOrder: 3 },
    ],
  },
  {
    id: '7',
    name: 'Training',
    slug: 'training',
    description: 'Compliance education and training',
    parentId: null,
    icon: 'school',
    sortOrder: 7,
    children: [
      { id: '7-1', name: 'Compliance Training', slug: 'compliance-training', description: 'Regulatory compliance training', parentId: '7', icon: 'cast_for_education', sortOrder: 1 },
      { id: '7-2', name: 'Certification Prep', slug: 'certification-prep', description: 'Exam preparation courses', parentId: '7', icon: 'workspace_premium', sortOrder: 2 },
      { id: '7-3', name: 'Awareness Programs', slug: 'awareness-programs', description: 'Security awareness training', parentId: '7', icon: 'campaign', sortOrder: 3 },
    ],
  },
];

// Mock reviews data
interface Review {
  id: string;
  providerId: string;
  providerName: string;
  reviewerId: string;
  reviewerName: string;
  rating: number;
  text: string;
  workRequestId: string;
  workRequestTitle: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
}

const mockReviews: Review[] = [
  { id: '1', providerId: 'p1', providerName: 'John Smith', reviewerId: 'r1', reviewerName: 'Acme Corp', rating: 5, text: 'Excellent work on our SOC 2 assessment. Very thorough and professional.', workRequestId: 'wr1', workRequestTitle: 'SOC 2 Type II Assessment', status: 'approved', createdAt: '2024-01-10', approvedAt: '2024-01-11', approvedBy: 'admin' },
  { id: '2', providerId: 'p2', providerName: 'Jane Doe', reviewerId: 'r2', reviewerName: 'TechStart Inc', rating: 4, text: 'Good consultant, helped us improve our security posture significantly.', workRequestId: 'wr2', workRequestTitle: 'Security Gap Analysis', status: 'pending', createdAt: '2024-01-14' },
  { id: '3', providerId: 'p1', providerName: 'John Smith', reviewerId: 'r3', reviewerName: 'SecureData LLC', rating: 3, text: 'Decent work but took longer than expected.', workRequestId: 'wr3', workRequestTitle: 'ISO 27001 Readiness', status: 'pending', createdAt: '2024-01-15' },
  { id: '4', providerId: 'p3', providerName: 'Bob Wilson', reviewerId: 'r4', reviewerName: 'FinTech Co', rating: 5, text: 'Amazing prompt engineer! Our AI workflows are 10x better now.', workRequestId: 'wr4', workRequestTitle: 'AI Workflow Optimization', status: 'approved', createdAt: '2024-01-08', approvedAt: '2024-01-09', approvedBy: 'admin' },
  { id: '5', providerId: 'p2', providerName: 'Jane Doe', reviewerId: 'r5', reviewerName: 'HealthCare Plus', rating: 1, text: 'Very unprofessional. Would not recommend.', workRequestId: 'wr5', workRequestTitle: 'HIPAA Compliance Review', status: 'rejected', createdAt: '2024-01-12' },
  { id: '6', providerId: 'p4', providerName: 'Alice Brown', reviewerId: 'r6', reviewerName: 'Retail Giant', rating: 4, text: 'Helped us achieve PCI compliance smoothly. Highly knowledgeable.', workRequestId: 'wr6', workRequestTitle: 'PCI-DSS Assessment', status: 'pending', createdAt: '2024-01-16' },
];

export default function AdminPage() {
  const router = useRouter();
  const { user, isAdmin, loading } = useZeroBias();
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [reviewSearchQuery, setReviewSearchQuery] = useState('');
  const [reviewStatusFilter, setReviewStatusFilter] = useState<string>('all');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['1', '2', '3']));
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

  // Review detail dialog state
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

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

  // Category handlers
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
    setCategoryForm({
      name: '',
      slug: '',
      description: '',
      parentId,
      icon: '',
      sortOrder: 0,
    });
    setCategoryDialogOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      slug: category.slug,
      description: category.description,
      parentId: category.parentId,
      icon: category.icon,
      sortOrder: category.sortOrder,
    });
    setCategoryDialogOpen(true);
  };

  const handleSaveCategory = () => {
    // In real app, this would call the API
    console.log('Saving category:', categoryForm);
    setCategoryDialogOpen(false);
  };

  // Review handlers
  const handleViewReview = (review: Review) => {
    setSelectedReview(review);
    setReviewDialogOpen(true);
  };

  const handleApproveReview = (reviewId: string) => {
    console.log('Approving review:', reviewId);
  };

  const handleRejectReview = (reviewId: string) => {
    console.log('Rejecting review:', reviewId);
  };

  const handleBulkApprove = () => {
    console.log('Bulk approving reviews:', Array.from(selectedReviews));
    setSelectedReviews(new Set());
  };

  const handleBulkReject = () => {
    console.log('Bulk rejecting reviews:', Array.from(selectedReviews));
    setSelectedReviews(new Set());
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

  const filteredReviews = mockReviews.filter(review => {
    const matchesSearch = review.providerName.toLowerCase().includes(reviewSearchQuery.toLowerCase()) ||
      review.reviewerName.toLowerCase().includes(reviewSearchQuery.toLowerCase()) ||
      review.text.toLowerCase().includes(reviewSearchQuery.toLowerCase());
    const matchesStatus = reviewStatusFilter === 'all' || review.status === reviewStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingReviewsCount = mockReviews.filter(r => r.status === 'pending').length;

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
                  <Typography component="span" variant="h6" fontWeight={600} sx={{ lineHeight: 1.2 }}>156</Typography>
                  <Typography component="span" variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>Total Users</Typography>
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
                  <Typography component="span" variant="h6" fontWeight={600} sx={{ lineHeight: 1.2 }}>{mockCategories.length}</Typography>
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
                  <Typography component="span" variant="h6" fontWeight={600} sx={{ lineHeight: 1.2 }}>48</Typography>
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
                  <Typography component="span" variant="h6" fontWeight={600} sx={{ lineHeight: 1.2 }}>{pendingReviewsCount}</Typography>
                  <Typography component="span" variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>Pending Reviews</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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

        {/* Users Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ px: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <TextField
                size="small"
                placeholder="Search users..."
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
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button startIcon={<RefreshIcon />} variant="outlined">
                  Refresh
                </Button>
                <Button startIcon={<AddIcon />} variant="contained">
                  Add User
                </Button>
              </Box>
            </Box>

            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Last Login</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mockUsers
                    .filter(u =>
                      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      u.email.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={row.role}
                          size="small"
                          color={row.role === 'Admin' ? 'primary' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={row.status}
                          size="small"
                          color={row.status === 'Active' ? 'success' : 'default'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{row.lastLogin}</TableCell>
                      <TableCell align="right">
                        <IconButton size="small">
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>

        {/* Organizations Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ px: 3 }}>
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
              <Button startIcon={<AddIcon />} variant="contained">
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
                        <IconButton size="small">
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>

        {/* Categories Tab */}
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
                <Button startIcon={<RefreshIcon />} variant="outlined">
                  Refresh
                </Button>
                <Button startIcon={<AddIcon />} variant="contained" onClick={() => handleAddCategory(null)}>
                  Add Category
                </Button>
              </Box>
            </Box>

            <Paper variant="outlined">
              <List disablePadding>
                {mockCategories
                  .filter(cat =>
                    cat.name.toLowerCase().includes(categorySearchQuery.toLowerCase()) ||
                    cat.children?.some(child => child.name.toLowerCase().includes(categorySearchQuery.toLowerCase()))
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
                            <IconButton size="small" color="error">
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
                              <Chip size="small" label={`${category.children?.length || 0} subcategories`} variant="outlined" />
                            </Box>
                          }
                          secondary={category.description}
                        />
                        {category.children && category.children.length > 0 && (
                          expandedCategories.has(category.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />
                        )}
                      </ListItemButton>
                    </ListItem>

                    {category.children && (
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
                                    <IconButton size="small" color="error">
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
                ))}
              </List>
            </Paper>
          </Box>
        </TabPanel>

        {/* Reviews Tab */}
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
                      onClick={handleBulkApprove}
                    >
                      Approve ({selectedReviews.size})
                    </Button>
                    <Button
                      startIcon={<RejectIcon />}
                      variant="outlined"
                      color="error"
                      onClick={handleBulkReject}
                    >
                      Reject ({selectedReviews.size})
                    </Button>
                  </>
                )}
                <Button startIcon={<RefreshIcon />} variant="outlined">
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
                  {filteredReviews.map((review) => (
                    <TableRow key={review.id} selected={selectedReviews.has(review.id)}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedReviews.has(review.id)}
                          onChange={() => toggleReviewSelection(review.id)}
                        />
                      </TableCell>
                      <TableCell>{review.providerName}</TableCell>
                      <TableCell>{review.reviewerName}</TableCell>
                      <TableCell>
                        <Rating value={review.rating} readOnly size="small" />
                      </TableCell>
                      <TableCell sx={{ maxWidth: 250 }}>
                        <Typography variant="body2" noWrap title={review.text}>
                          {review.text}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={review.status}
                          size="small"
                          color={review.status === 'approved' ? 'success' : review.status === 'rejected' ? 'error' : 'warning'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{review.createdAt}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="View details">
                          <IconButton size="small" onClick={() => handleViewReview(review)}>
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {review.status === 'pending' && (
                          <>
                            <Tooltip title="Approve">
                              <IconButton size="small" color="success" onClick={() => handleApproveReview(review.id)}>
                                <ApproveIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reject">
                              <IconButton size="small" color="error" onClick={() => handleRejectReview(review.id)}>
                                <RejectIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>

        {/* Settings Tab */}
        <TabPanel value={tabValue} index={4}>
          <Box sx={{ px: 3 }}>
            <Typography variant="h6" gutterBottom>
              Application Settings
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      Registration
                    </Typography>
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Allow new user registration"
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Require email verification"
                    />
                    <FormControlLabel
                      control={<Switch />}
                      label="Require admin approval"
                    />
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      Notifications
                    </Typography>
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Send email notifications"
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="New user alerts"
                    />
                    <FormControlLabel
                      control={<Switch />}
                      label="Weekly digest"
                    />
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      Security
                    </Typography>
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Enforce 2FA for admins"
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Session timeout (30 min)"
                    />
                    <FormControlLabel
                      control={<Switch />}
                      label="IP allowlisting"
                    />
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      Marketplace
                    </Typography>
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Enable SME listings"
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Allow reviews"
                    />
                    <FormControlLabel
                      control={<Switch />}
                      label="Require verification badge"
                    />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="contained">
                Save Settings
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
              helperText="URL-friendly identifier (e.g., soc2-assessors)"
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
                {mockCategories.map((cat) => (
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
          <Button onClick={handleSaveCategory} variant="contained">
            {editingCategory ? 'Save Changes' : 'Add Category'}
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
                <Typography fontWeight={500}>{selectedReview.providerName}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Reviewer</Typography>
                <Typography fontWeight={500}>{selectedReview.reviewerName}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Work Request</Typography>
                <Typography fontWeight={500}>{selectedReview.workRequestTitle}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Rating</Typography>
                <Rating value={selectedReview.rating} readOnly />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Review Text</Typography>
                <Typography>{selectedReview.text}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Status</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={selectedReview.status}
                    color={selectedReview.status === 'approved' ? 'success' : selectedReview.status === 'rejected' ? 'error' : 'warning'}
                    variant="outlined"
                  />
                </Box>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Submitted</Typography>
                <Typography>{selectedReview.createdAt}</Typography>
              </Box>
              {selectedReview.approvedAt && (
                <Box>
                  <Typography variant="caption" color="text.secondary">Approved</Typography>
                  <Typography>{selectedReview.approvedAt} by {selectedReview.approvedBy}</Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {selectedReview?.status === 'pending' && (
            <>
              <Button
                onClick={() => {
                  handleRejectReview(selectedReview.id);
                  setReviewDialogOpen(false);
                }}
                color="error"
              >
                Reject
              </Button>
              <Button
                onClick={() => {
                  handleApproveReview(selectedReview.id);
                  setReviewDialogOpen(false);
                }}
                variant="contained"
                color="success"
              >
                Approve
              </Button>
            </>
          )}
          <Button onClick={() => setReviewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
