'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Avatar,
  Grid,
  Divider,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Rating,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  SelectChangeEvent,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  WorkOutline as WorkIcon,
  CheckCircle as CheckCircleIcon,
  HourglassEmpty as PendingIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useZeroBias } from '@/context/ZeroBiasContext';
import { useProfile, ProfileUpdateData } from '@/hooks/useProfile';
import {
  useRoles, useRoleCategories, useSkills, useProducts, useFrameworks, useSegments, useServiceSegments,
  CatalogRole, CatalogSkill, CatalogProduct, CatalogFramework, CatalogSegment, ServiceSegment
} from '@/hooks/useZeroBiasCatalog';
import {
  RoleAutocomplete, SkillAutocomplete, ProductAutocomplete, FrameworkAutocomplete, SegmentAutocomplete, ServiceSegmentAutocomplete
} from '@/components/catalog';

export default function MyProfilePage() {
  const router = useRouter();
  const { user, org, loading } = useZeroBias();
  const {
    profile, isLoading: profileLoading, error: profileError,
    updateProfile, isUpdating,
    addRole, isAddingRole, deleteRole, updateRole, isUpdatingRole,
    addSkill, isAddingSkill, deleteSkill, updateSkill, isUpdatingSkill,
    addProduct, isAddingProduct, deleteProduct, updateProduct, isUpdatingProduct,
    addFramework, isAddingFramework, deleteFramework, updateFramework, isUpdatingFramework,
    addSegment, isAddingSegment, deleteSegment, updateSegment, isUpdatingSegment,
    addServiceSegment, isAddingServiceSegment, deleteServiceSegment, updateServiceSegment, isUpdatingServiceSegment,
    addService, isAddingService, deleteService, updateService,
    reviews, reviewsLoading,
  } = useProfile();

  // ZeroBias catalog data for lookups
  const { data: rolesData } = useRoles();
  const { data: roleCategoriesData } = useRoleCategories();
  const { data: skillsData } = useSkills();
  const { data: productsData } = useProducts();
  const { data: frameworksData } = useFrameworks();
  const { data: segmentsData } = useSegments();
  const { data: serviceSegmentsData } = useServiceSegments();

  // Fetch work requests for current user
  const { data: workRequestsData } = useQuery({
    queryKey: ['myWorkRequests', user?.id],
    queryFn: async () => {
      const response = await fetch('/api/requests');
      if (!response.ok) throw new Error('Failed to fetch work requests');
      return response.json();
    },
    enabled: !!user,
  });

  const workStats = useMemo(() => {
    const requests = workRequestsData || [];
    return {
      open: requests.filter((r: { status: string }) => r.status === 'open').length,
      inProgress: requests.filter((r: { status: string }) => r.status === 'in_progress').length,
      completed: requests.filter((r: { status: string }) => r.status === 'completed').length,
    };
  }, [workRequestsData]);

  // Profile form state
  const [headline, setHeadline] = useState('');
  const [about, setAbout] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [availabilityStatus, setAvailabilityStatus] = useState<'available' | 'busy' | 'unavailable'>('available');
  const [responseTime, setResponseTime] = useState('');
  const [profileDirty, setProfileDirty] = useState(false);

  // Role dialog state
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<{ id: string; zerobiasRoleId: string } | null>(null);
  const [selectedRole, setSelectedRole] = useState<CatalogRole | null>(null);
  const [newRoleIsPrimary, setNewRoleIsPrimary] = useState(false);
  const [newRoleYears, setNewRoleYears] = useState('');

  // Skill dialog state
  const [skillDialogOpen, setSkillDialogOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<{ id: string; zerobiasSkillId: string } | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<CatalogSkill | null>(null);
  const [newSkillProficiency, setNewSkillProficiency] = useState('intermediate');
  const [newSkillYears, setNewSkillYears] = useState('');

  // Product dialog state
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<{ id: string; zerobiasProductId: string } | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [newProductProficiency, setNewProductProficiency] = useState('intermediate');
  const [newProductYears, setNewProductYears] = useState('');
  const [newProductCertified, setNewProductCertified] = useState(false);
  const [newProductCertDetails, setNewProductCertDetails] = useState('');

  // Framework dialog state
  const [frameworkDialogOpen, setFrameworkDialogOpen] = useState(false);
  const [editingFramework, setEditingFramework] = useState<{ id: string; zerobiasFrameworkId: string } | null>(null);
  const [selectedFramework, setSelectedFramework] = useState<CatalogFramework | null>(null);
  const [newFrameworkProficiency, setNewFrameworkProficiency] = useState('intermediate');
  const [newFrameworkYears, setNewFrameworkYears] = useState('');
  const [newFrameworkAssessorCertified, setNewFrameworkAssessorCertified] = useState(false);
  const [newFrameworkImplementation, setNewFrameworkImplementation] = useState(false);
  const [newFrameworkAudit, setNewFrameworkAudit] = useState(false);

  // Segment dialog state
  const [segmentDialogOpen, setSegmentDialogOpen] = useState(false);
  const [editingSegment, setEditingSegment] = useState<{ id: string; zerobiasSegmentId: string } | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<CatalogSegment | null>(null);
  const [newSegmentIsPrimary, setNewSegmentIsPrimary] = useState(false);

  // Service segment dialog state (professional service categories)
  const [serviceSegmentDialogOpen, setServiceSegmentDialogOpen] = useState(false);
  const [editingServiceSegment, setEditingServiceSegment] = useState<{ id: string; zerobiasServiceSegmentId: string } | null>(null);
  const [selectedServiceSegment, setSelectedServiceSegment] = useState<{ id: string; name: string; code: string; description?: string } | null>(null);
  const [newServiceSegmentIsPrimary, setNewServiceSegmentIsPrimary] = useState(false);

  // Service dialog state
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<{ id: string } | null>(null);
  const [newServiceTitle, setNewServiceTitle] = useState('');
  const [newServiceDescription, setNewServiceDescription] = useState('');
  const [newServiceCategory, setNewServiceCategory] = useState('');
  const [newServicePricingType, setNewServicePricingType] = useState('fixed');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newServiceDeliveryTime, setNewServiceDeliveryTime] = useState('');

  // Sync profile data into form state when loaded
  useEffect(() => {
    if (profile) {
      setHeadline(profile.headline || '');
      setAbout(profile.about || '');
      setHourlyRate(profile.hourlyRate || '');
      setAvailabilityStatus(profile.availabilityStatus || 'available');
      setResponseTime(profile.responseTime || '');
      setProfileDirty(false);
    }
  }, [profile]);

  if (loading || profileLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading profile...</Typography>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography>Please sign in to view your profile.</Typography>
      </Container>
    );
  }

  const initials = (user.displayName || user.email || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const approvedReviews = reviews.filter(r => r.approved);
  const pendingReviews = reviews.filter(r => !r.approved);
  const avgRating = approvedReviews.length > 0
    ? approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length
    : 0;

  const handleSaveProfile = () => {
    const data: ProfileUpdateData = {
      headline: headline || null,
      about: about || null,
      hourlyRate: hourlyRate || null,
      availabilityStatus,
      responseTime: responseTime || null,
    };
    updateProfile(data);
    setProfileDirty(false);
  };

  const openAddSkillDialog = () => {
    setEditingSkill(null);
    setSelectedSkill(null);
    setNewSkillProficiency('intermediate');
    setNewSkillYears('');
    setSkillDialogOpen(true);
  };

  const openEditSkillDialog = (skill: { id: string; zerobiasSkillId: string; proficiencyLevel?: string | null; yearsExperience?: number | null }) => {
    setEditingSkill({ id: skill.id, zerobiasSkillId: skill.zerobiasSkillId });
    // Find the catalog skill to set as selected
    const catalogSkill = skillsData?.items.find(s => s.id === skill.zerobiasSkillId || s.code === skill.zerobiasSkillId);
    setSelectedSkill(catalogSkill || null);
    setNewSkillProficiency(skill.proficiencyLevel || 'intermediate');
    setNewSkillYears(skill.yearsExperience?.toString() || '');
    setSkillDialogOpen(true);
  };

  const handleSaveSkill = () => {
    if (!selectedSkill) return;
    if (editingSkill) {
      updateSkill({
        skillId: editingSkill.id,
        zerobiasSkillId: selectedSkill.id,
        proficiencyLevel: newSkillProficiency || undefined,
        yearsExperience: newSkillYears ? parseInt(newSkillYears) : undefined,
      });
    } else {
      addSkill({
        zerobiasSkillId: selectedSkill.id,
        skillName: selectedSkill.name,
        proficiencyLevel: newSkillProficiency || undefined,
        yearsExperience: newSkillYears ? parseInt(newSkillYears) : undefined,
      });
    }
    setSkillDialogOpen(false);
    setEditingSkill(null);
  };

  const openAddServiceDialog = () => {
    setEditingService(null);
    setNewServiceTitle('');
    setNewServiceDescription('');
    setNewServiceCategory('');
    setNewServicePricingType('fixed');
    setNewServicePrice('');
    setNewServiceDeliveryTime('');
    setServiceDialogOpen(true);
  };

  const openEditServiceDialog = (service: { id: string; title: string; description?: string | null; category: string; pricingType: string; price?: string | null; deliveryTime?: string | null }) => {
    setEditingService({ id: service.id });
    setNewServiceTitle(service.title);
    setNewServiceDescription(service.description || '');
    setNewServiceCategory(service.category);
    setNewServicePricingType(service.pricingType);
    setNewServicePrice(service.price || '');
    setNewServiceDeliveryTime(service.deliveryTime || '');
    setServiceDialogOpen(true);
  };

  const handleSaveService = () => {
    if (!newServiceTitle.trim() || !newServiceCategory || !newServicePricingType) return;
    if (editingService) {
      updateService({
        serviceId: editingService.id,
        title: newServiceTitle.trim(),
        category: newServiceCategory,
        pricingType: newServicePricingType,
        description: newServiceDescription || undefined,
        price: newServicePrice || undefined,
        deliveryTime: newServiceDeliveryTime || undefined,
      });
    } else {
      addService({
        title: newServiceTitle.trim(),
        category: newServiceCategory,
        pricingType: newServicePricingType,
        description: newServiceDescription || undefined,
        price: newServicePrice || undefined,
        deliveryTime: newServiceDeliveryTime || undefined,
      });
    }
    setServiceDialogOpen(false);
    setEditingService(null);
  };

  const markDirty = () => { if (!profileDirty) setProfileDirty(true); };

  // Lookup helpers for ZeroBias catalog items
  const getRoleName = (roleId: string) => {
    const role = rolesData?.items.find(r => r.id === roleId || r.code === roleId);
    return role?.name || roleId;
  };

  const getRoleCategory = (roleId: string) => {
    const role = rolesData?.items.find(r => r.id === roleId || r.code === roleId);
    if (!role?.categoryId) return null;
    const category = roleCategoriesData?.items.find(c => c.id === role.categoryId);
    return category?.name || null;
  };

  const getSkillName = (skillId: string) => {
    const skill = skillsData?.items.find(s => s.id === skillId || s.code === skillId);
    return skill?.name || skillId;
  };

  const getSkillCode = (skillId: string) => {
    const skill = skillsData?.items.find(s => s.id === skillId || s.code === skillId);
    return skill?.code || null;
  };

  const getProductName = (productId: string) => {
    const product = productsData?.items.find(p => p.id === productId || p.code === productId);
    return product?.name || productId;
  };

  const getProductVendor = (productId: string) => {
    const product = productsData?.items.find(p => p.id === productId || p.code === productId);
    return product?.vendorName || null;
  };

  const getFrameworkName = (frameworkId: string) => {
    const framework = frameworksData?.items.find(f => f.id === frameworkId || f.code === frameworkId);
    return framework?.name || frameworkId;
  };

  const getSegmentName = (segmentId: string) => {
    const segment = segmentsData?.items.find(s => s.id === segmentId || s.code === segmentId);
    return segment?.name || segmentId;
  };

  const getServiceSegmentName = (serviceSegmentId: string) => {
    const segment = serviceSegmentsData?.items.find(s => s.id === serviceSegmentId || s.name === serviceSegmentId);
    return segment?.description || segment?.name || serviceSegmentId;
  };

  // Role dialog handlers
  const openAddRoleDialog = () => {
    setEditingRole(null);
    setSelectedRole(null);
    setNewRoleIsPrimary(false);
    setNewRoleYears('');
    setRoleDialogOpen(true);
  };

  const openEditRoleDialog = (role: { id: string; zerobiasRoleId: string; isPrimary?: boolean | null; yearsInRole?: number | null }) => {
    setEditingRole({ id: role.id, zerobiasRoleId: role.zerobiasRoleId });
    // Find the catalog role to set as selected
    const catalogRole = rolesData?.items.find(r => r.id === role.zerobiasRoleId || r.code === role.zerobiasRoleId);
    setSelectedRole(catalogRole || null);
    setNewRoleIsPrimary(role.isPrimary ?? false);
    setNewRoleYears(role.yearsInRole?.toString() || '');
    setRoleDialogOpen(true);
  };

  const handleSaveRole = () => {
    if (!selectedRole) return;
    if (editingRole) {
      updateRole({
        roleId: editingRole.id,
        isPrimary: newRoleIsPrimary,
        yearsInRole: newRoleYears ? parseInt(newRoleYears) : undefined,
      });
    } else {
      addRole({
        zerobiasRoleId: selectedRole.id,
        isPrimary: newRoleIsPrimary,
        yearsInRole: newRoleYears ? parseInt(newRoleYears) : undefined,
      });
    }
    setRoleDialogOpen(false);
    setEditingRole(null);
  };

  // Product dialog handlers
  const openAddProductDialog = () => {
    setEditingProduct(null);
    setSelectedProduct(null);
    setNewProductProficiency('intermediate');
    setNewProductYears('');
    setNewProductCertified(false);
    setNewProductCertDetails('');
    setProductDialogOpen(true);
  };

  const openEditProductDialog = (product: { id: string; zerobiasProductId: string; proficiencyLevel?: string | null; yearsExperience?: number | null; certified?: boolean | null; certificationDetails?: string | null }) => {
    setEditingProduct({ id: product.id, zerobiasProductId: product.zerobiasProductId });
    const catalogProduct = productsData?.items.find(p => p.id === product.zerobiasProductId || p.code === product.zerobiasProductId);
    setSelectedProduct(catalogProduct || null);
    setNewProductProficiency(product.proficiencyLevel || 'intermediate');
    setNewProductYears(product.yearsExperience?.toString() || '');
    setNewProductCertified(product.certified ?? false);
    setNewProductCertDetails(product.certificationDetails || '');
    setProductDialogOpen(true);
  };

  const handleSaveProduct = () => {
    if (!selectedProduct) return;
    if (editingProduct) {
      updateProduct({
        productId: editingProduct.id,
        proficiencyLevel: newProductProficiency || undefined,
        yearsExperience: newProductYears ? parseInt(newProductYears) : undefined,
        certified: newProductCertified,
        certificationDetails: newProductCertDetails || undefined,
      });
    } else {
      addProduct({
        zerobiasProductId: selectedProduct.id,
        proficiencyLevel: newProductProficiency || undefined,
        yearsExperience: newProductYears ? parseInt(newProductYears) : undefined,
        certified: newProductCertified,
        certificationDetails: newProductCertDetails || undefined,
      });
    }
    setProductDialogOpen(false);
    setEditingProduct(null);
  };

  // Framework dialog handlers
  const openAddFrameworkDialog = () => {
    setEditingFramework(null);
    setSelectedFramework(null);
    setNewFrameworkProficiency('intermediate');
    setNewFrameworkYears('');
    setNewFrameworkAssessorCertified(false);
    setNewFrameworkImplementation(false);
    setNewFrameworkAudit(false);
    setFrameworkDialogOpen(true);
  };

  const openEditFrameworkDialog = (framework: { id: string; zerobiasFrameworkId: string; proficiencyLevel?: string | null; yearsExperience?: number | null; assessorCertified?: boolean | null; implementationExperience?: boolean | null; auditExperience?: boolean | null }) => {
    setEditingFramework({ id: framework.id, zerobiasFrameworkId: framework.zerobiasFrameworkId });
    const catalogFramework = frameworksData?.items.find(f => f.id === framework.zerobiasFrameworkId || f.code === framework.zerobiasFrameworkId);
    setSelectedFramework(catalogFramework || null);
    setNewFrameworkProficiency(framework.proficiencyLevel || 'intermediate');
    setNewFrameworkYears(framework.yearsExperience?.toString() || '');
    setNewFrameworkAssessorCertified(framework.assessorCertified ?? false);
    setNewFrameworkImplementation(framework.implementationExperience ?? false);
    setNewFrameworkAudit(framework.auditExperience ?? false);
    setFrameworkDialogOpen(true);
  };

  const handleSaveFramework = () => {
    if (!selectedFramework) return;
    if (editingFramework) {
      updateFramework({
        frameworkId: editingFramework.id,
        proficiencyLevel: newFrameworkProficiency || undefined,
        yearsExperience: newFrameworkYears ? parseInt(newFrameworkYears) : undefined,
        assessorCertified: newFrameworkAssessorCertified,
        implementationExperience: newFrameworkImplementation,
        auditExperience: newFrameworkAudit,
      });
    } else {
      addFramework({
        zerobiasFrameworkId: selectedFramework.id,
        proficiencyLevel: newFrameworkProficiency || undefined,
        yearsExperience: newFrameworkYears ? parseInt(newFrameworkYears) : undefined,
        assessorCertified: newFrameworkAssessorCertified,
        implementationExperience: newFrameworkImplementation,
        auditExperience: newFrameworkAudit,
      });
    }
    setFrameworkDialogOpen(false);
    setEditingFramework(null);
  };

  // Segment dialog handlers
  const openAddSegmentDialog = () => {
    setEditingSegment(null);
    setSelectedSegment(null);
    setNewSegmentIsPrimary(false);
    setSegmentDialogOpen(true);
  };

  const openEditSegmentDialog = (segment: { id: string; zerobiasSegmentId: string; isPrimary?: boolean | null }) => {
    setEditingSegment({ id: segment.id, zerobiasSegmentId: segment.zerobiasSegmentId });
    const catalogSegment = segmentsData?.items.find(s => s.id === segment.zerobiasSegmentId || s.code === segment.zerobiasSegmentId);
    setSelectedSegment(catalogSegment || null);
    setNewSegmentIsPrimary(segment.isPrimary ?? false);
    setSegmentDialogOpen(true);
  };

  const handleSaveSegment = () => {
    if (!selectedSegment) return;
    if (editingSegment) {
      updateSegment({
        segmentId: editingSegment.id,
        isPrimary: newSegmentIsPrimary,
      });
    } else {
      addSegment({
        zerobiasSegmentId: selectedSegment.id,
        isPrimary: newSegmentIsPrimary,
      });
    }
    setSegmentDialogOpen(false);
    setEditingSegment(null);
  };

  // Service segment dialog handlers (professional service categories)
  const openAddServiceSegmentDialog = () => {
    setEditingServiceSegment(null);
    setSelectedServiceSegment(null);
    setNewServiceSegmentIsPrimary(false);
    setServiceSegmentDialogOpen(true);
  };

  const openEditServiceSegmentDialog = (serviceSegment: { id: string; zerobiasServiceSegmentId: string; isPrimary?: boolean | null }) => {
    setEditingServiceSegment({ id: serviceSegment.id, zerobiasServiceSegmentId: serviceSegment.zerobiasServiceSegmentId });
    // Find the catalog service segment to set as selected
    const catalogServiceSegment = serviceSegmentsData?.items.find(s => s.id === serviceSegment.zerobiasServiceSegmentId);
    if (catalogServiceSegment) {
      setSelectedServiceSegment({
        id: catalogServiceSegment.id,
        name: catalogServiceSegment.description || catalogServiceSegment.name,
        code: catalogServiceSegment.name,
        description: catalogServiceSegment.description,
      });
    } else {
      setSelectedServiceSegment(null);
    }
    setNewServiceSegmentIsPrimary(serviceSegment.isPrimary ?? false);
    setServiceSegmentDialogOpen(true);
  };

  const handleSaveServiceSegment = () => {
    if (!selectedServiceSegment) return;
    if (editingServiceSegment) {
      updateServiceSegment({
        serviceSegmentId: editingServiceSegment.id,
        isPrimary: newServiceSegmentIsPrimary,
      });
    } else {
      addServiceSegment({
        zerobiasServiceSegmentId: selectedServiceSegment.id,
        isPrimary: newServiceSegmentIsPrimary,
      });
    }
    setServiceSegmentDialogOpen(false);
    setEditingServiceSegment(null);
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
          My Profile
        </Typography>
        <Typography color="text.secondary">
          Manage your provider profile, skills, and service offerings
        </Typography>
      </Box>

      {profileError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load profile: {profileError.message}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left Column - Profile Card */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Avatar
                sx={{
                  width: 100,
                  height: 100,
                  fontSize: '2rem',
                  bgcolor: 'primary.main',
                  mx: 'auto',
                  mb: 2,
                }}
              >
                {initials}
              </Avatar>
              <Typography variant="h6" fontWeight={600}>
                {user.displayName || 'User'}
              </Typography>
              <Typography color="text.secondary" gutterBottom>
                {user.email}
              </Typography>
              {org && (
                <Chip
                  label={org.displayName || org.name}
                  size="small"
                  sx={{ mt: 1 }}
                />
              )}

              {/* Rating */}
              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <Rating value={avgRating} readOnly precision={0.1} size="small" />
                <Typography variant="body2" color="text.secondary">
                  ({approvedReviews.length} reviews)
                </Typography>
              </Box>

              {/* Quick Stats */}
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-around' }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" fontWeight={600}>
                    {profile?.totalJobsCompleted ?? 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">Jobs Done</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" fontWeight={600}>
                    {profile?.hourlyRate ? `$${profile.hourlyRate}` : '--'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">Hourly Rate</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" fontWeight={600}>
                    {profile?.ratingAverage ? `${profile.ratingAverage}` : '--'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">Rating</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Work Request Summary */}
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Work Requests
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PendingIcon color="warning" fontSize="small" />
                  <Typography variant="body2">Open: {workStats.open}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WorkIcon color="info" fontSize="small" />
                  <Typography variant="body2">In Progress: {workStats.inProgress}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircleIcon color="success" fontSize="small" />
                  <Typography variant="body2">Completed: {workStats.completed}</Typography>
                </Box>
              </Box>

              <Button fullWidth variant="outlined" sx={{ mt: 2 }} size="small">
                View All Requests
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - Editable Sections */}
        <Grid size={{ xs: 12, md: 8 }}>
          {/* Profile Information */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Provider Profile
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Display Name"
                    value={user.displayName || ''}
                    disabled
                    helperText="Managed by ZeroBias"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Headline"
                    value={headline}
                    onChange={(e) => { setHeadline(e.target.value); markDirty(); }}
                    placeholder="e.g., SOC 2 Expert | ISO 27001 Lead Auditor"
                  />
                </Grid>
                <Grid size={12}>
                  <TextField
                    fullWidth
                    label="About"
                    multiline
                    rows={3}
                    value={about}
                    onChange={(e) => { setAbout(e.target.value); markDirty(); }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Hourly Rate"
                    type="number"
                    value={hourlyRate}
                    onChange={(e) => { setHourlyRate(e.target.value); markDirty(); }}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <FormControl fullWidth>
                    <InputLabel>Availability</InputLabel>
                    <Select
                      value={availabilityStatus}
                      label="Availability"
                      onChange={(e: SelectChangeEvent) => {
                        setAvailabilityStatus(e.target.value as 'available' | 'busy' | 'unavailable');
                        markDirty();
                      }}
                    >
                      <MenuItem value="available">Available</MenuItem>
                      <MenuItem value="busy">Busy</MenuItem>
                      <MenuItem value="unavailable">Unavailable</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Response Time"
                    value={responseTime}
                    onChange={(e) => { setResponseTime(e.target.value); markDirty(); }}
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                {profileDirty && (
                  <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center', mr: 1 }}>
                    Unsaved changes
                  </Typography>
                )}
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveProfile}
                  disabled={!profileDirty || isUpdating}
                >
                  {isUpdating ? 'Saving...' : 'Save Profile'}
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Roles Section */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                  Role Experience
                </Typography>
                <Button
                  startIcon={<AddIcon />}
                  size="small"
                  onClick={openAddRoleDialog}
                >
                  Add Role
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />

              {profile?.roles && profile.roles.length > 0 ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {profile.roles.map((role) => (
                    <Chip
                      key={role.id}
                      icon={role.isPrimary ? <StarIcon fontSize="small" /> : undefined}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {getRoleName(role.zerobiasRoleId)}
                          {role.yearsInRole && (
                            <Typography variant="caption" sx={{ opacity: 0.7 }}>
                              · {role.yearsInRole}y
                            </Typography>
                          )}
                        </Box>
                      }
                      onClick={() => openEditRoleDialog(role)}
                      onDelete={() => deleteRole(role.id)}
                      color={role.isPrimary ? 'primary' : 'default'}
                      variant={role.isPrimary ? 'filled' : 'outlined'}
                      sx={{ cursor: 'pointer' }}
                    />
                  ))}
                </Box>
              ) : (
                <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                  No roles added yet. Click &quot;Add Role&quot; to get started.
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Skills Section */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                  Skills & Expertise
                </Typography>
                <Button
                  startIcon={<AddIcon />}
                  size="small"
                  onClick={openAddSkillDialog}
                >
                  Add Skill
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />

              {profile?.skills && profile.skills.length > 0 ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {profile.skills.map((skill) => (
                    <Chip
                      key={skill.id}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {getSkillName(skill.zerobiasSkillId)}
                          {getSkillCode(skill.zerobiasSkillId) && (
                            <Typography variant="caption" sx={{ opacity: 0.5 }}>
                              ({getSkillCode(skill.zerobiasSkillId)})
                            </Typography>
                          )}
                          <Typography variant="caption" sx={{ opacity: 0.7 }}>
                            {skill.proficiencyLevel && ` · ${skill.proficiencyLevel}`}
                            {skill.yearsExperience && ` · ${skill.yearsExperience}y`}
                          </Typography>
                        </Box>
                      }
                      onClick={() => openEditSkillDialog(skill)}
                      onDelete={() => deleteSkill(skill.id)}
                      color={skill.proficiencyLevel === 'expert' ? 'primary' : 'default'}
                      variant={skill.proficiencyLevel === 'expert' ? 'filled' : 'outlined'}
                      sx={{ cursor: 'pointer' }}
                    />
                  ))}
                </Box>
              ) : (
                <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                  No skills added yet. Click &quot;Add Skill&quot; to get started.
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Product Experience Section */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                  Product Experience
                </Typography>
                <Button
                  startIcon={<AddIcon />}
                  size="small"
                  onClick={openAddProductDialog}
                >
                  Add Product
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />

              {profile?.products && profile.products.length > 0 ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {profile.products.map((product) => (
                    <Chip
                      key={product.id}
                      icon={product.certified ? <CheckCircleIcon fontSize="small" /> : undefined}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {getProductName(product.zerobiasProductId)}
                          {getProductVendor(product.zerobiasProductId) && (
                            <Typography variant="caption" sx={{ opacity: 0.5 }}>
                              ({getProductVendor(product.zerobiasProductId)})
                            </Typography>
                          )}
                          <Typography variant="caption" sx={{ opacity: 0.7 }}>
                            {product.proficiencyLevel && ` · ${product.proficiencyLevel}`}
                            {product.yearsExperience && ` · ${product.yearsExperience}y`}
                          </Typography>
                        </Box>
                      }
                      onClick={() => openEditProductDialog(product)}
                      onDelete={() => deleteProduct(product.id)}
                      color={product.certified ? 'success' : 'default'}
                      variant={product.certified ? 'filled' : 'outlined'}
                      sx={{ cursor: 'pointer' }}
                    />
                  ))}
                </Box>
              ) : (
                <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                  No product experience added yet. Click &quot;Add Product&quot; to get started.
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Framework Experience Section */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                  Framework Experience
                </Typography>
                <Button
                  startIcon={<AddIcon />}
                  size="small"
                  onClick={openAddFrameworkDialog}
                >
                  Add Framework
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />

              {profile?.frameworks && profile.frameworks.length > 0 ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {profile.frameworks.map((framework) => (
                    <Chip
                      key={framework.id}
                      icon={framework.assessorCertified ? <CheckCircleIcon fontSize="small" /> : undefined}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {getFrameworkName(framework.zerobiasFrameworkId)}
                          <Typography variant="caption" sx={{ opacity: 0.7 }}>
                            {framework.proficiencyLevel && ` · ${framework.proficiencyLevel}`}
                            {framework.yearsExperience && ` · ${framework.yearsExperience}y`}
                          </Typography>
                        </Box>
                      }
                      onClick={() => openEditFrameworkDialog(framework)}
                      onDelete={() => deleteFramework(framework.id)}
                      color={framework.assessorCertified ? 'success' : 'default'}
                      variant={framework.assessorCertified ? 'filled' : 'outlined'}
                      sx={{ cursor: 'pointer' }}
                    />
                  ))}
                </Box>
              ) : (
                <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                  No framework experience added yet. Click &quot;Add Framework&quot; to get started.
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Service Categories Section (Professional service categories) */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                  Service Categories
                </Typography>
                <Button
                  startIcon={<AddIcon />}
                  size="small"
                  onClick={openAddServiceSegmentDialog}
                >
                  Add Category
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />

              {profile?.serviceSegments && profile.serviceSegments.length > 0 ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {profile.serviceSegments.map((serviceSegment) => (
                    <Chip
                      key={serviceSegment.id}
                      icon={serviceSegment.isPrimary ? <StarIcon fontSize="small" /> : undefined}
                      label={getServiceSegmentName(serviceSegment.zerobiasServiceSegmentId)}
                      onClick={() => openEditServiceSegmentDialog(serviceSegment)}
                      onDelete={() => deleteServiceSegment(serviceSegment.id)}
                      color={serviceSegment.isPrimary ? 'primary' : 'default'}
                      variant={serviceSegment.isPrimary ? 'filled' : 'outlined'}
                      sx={{ cursor: 'pointer' }}
                    />
                  ))}
                </Box>
              ) : (
                <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                  No service categories added yet. Click &quot;Add Category&quot; to get started.
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Market Segment Experience Section */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                  Market Segment Experience
                </Typography>
                <Button
                  startIcon={<AddIcon />}
                  size="small"
                  onClick={openAddSegmentDialog}
                >
                  Add Segment
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />

              {profile?.segments && profile.segments.length > 0 ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {profile.segments.map((segment) => (
                    <Chip
                      key={segment.id}
                      icon={segment.isPrimary ? <StarIcon fontSize="small" /> : undefined}
                      label={getSegmentName(segment.zerobiasSegmentId)}
                      onClick={() => openEditSegmentDialog(segment)}
                      onDelete={() => deleteSegment(segment.id)}
                      color={segment.isPrimary ? 'primary' : 'default'}
                      variant={segment.isPrimary ? 'filled' : 'outlined'}
                      sx={{ cursor: 'pointer' }}
                    />
                  ))}
                </Box>
              ) : (
                <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                  No market segments added yet. Click &quot;Add Segment&quot; to get started.
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Service Offerings Section */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                  Service Offerings
                </Typography>
                <Button
                  startIcon={<AddIcon />}
                  size="small"
                  onClick={openAddServiceDialog}
                >
                  Add Service
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />

              {profile?.serviceOfferings && profile.serviceOfferings.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Service</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell>Price</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {profile.serviceOfferings.map((service) => (
                        <TableRow key={service.id}>
                          <TableCell>{service.title}</TableCell>
                          <TableCell>
                            <Chip label={service.category} size="small" />
                          </TableCell>
                          <TableCell>
                            {service.price ? `$${service.price}` : '--'}
                            {service.pricingType === 'hourly' ? '/hr' : ''}
                          </TableCell>
                          <TableCell align="right">
                            <IconButton size="small" onClick={() => openEditServiceDialog(service)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" color="error" onClick={() => deleteService(service.id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                  No services offered yet. Click &quot;Add Service&quot; to list your first offering.
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Reviews Section */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h6" fontWeight={600}>
                    Reviews ({approvedReviews.length} approved)
                  </Typography>
                  {pendingReviews.length > 0 && (
                    <Chip
                      label={`${pendingReviews.length} pending`}
                      size="small"
                      color="warning"
                    />
                  )}
                </Box>
                <Button size="small" onClick={() => router.push('/my-profile/moderate-reviews')}>
                  Moderate Reviews
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />

              {reviewsLoading ? (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : approvedReviews.length === 0 ? (
                <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                  No approved reviews yet
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {approvedReviews.map((review) => (
                    <Paper key={review.id} variant="outlined" sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Rating value={review.rating} readOnly size="small" />
                          <Typography variant="body2" fontWeight={500}>
                            {review.reviewerZerobiasUserId}
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                      {review.reviewText && (
                        <Typography variant="body2">{review.reviewText}</Typography>
                      )}
                    </Paper>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Role Dialog (Add/Edit) */}
      <Dialog open={roleDialogOpen} onClose={() => setRoleDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingRole ? 'Edit Role' : 'Add Work Role'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={12}>
              <RoleAutocomplete
                value={selectedRole}
                onChange={setSelectedRole}
                label="Work Role"
                placeholder="Search NICE work roles..."
                disabled={!!editingRole}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Primary Role?</InputLabel>
                <Select
                  label="Primary Role?"
                  value={newRoleIsPrimary ? 'yes' : 'no'}
                  onChange={(e) => setNewRoleIsPrimary(e.target.value === 'yes')}
                >
                  <MenuItem value="yes">Yes - This is my primary role</MenuItem>
                  <MenuItem value="no">No - Secondary role</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Years in Role"
                type="number"
                value={newRoleYears}
                onChange={(e) => setNewRoleYears(e.target.value)}
                placeholder="e.g., 5"
              />
            </Grid>
            {selectedRole?.description && (
              <Grid size={12}>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                  {selectedRole.description}
                </Typography>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveRole}
            disabled={!selectedRole || isAddingRole || isUpdatingRole}
          >
            {editingRole
              ? (isUpdatingRole ? 'Saving...' : 'Save')
              : (isAddingRole ? 'Adding...' : 'Add Role')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Skill Dialog (Add/Edit) */}
      <Dialog open={skillDialogOpen} onClose={() => setSkillDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingSkill ? 'Edit Skill' : 'Add Skill'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={12}>
              <SkillAutocomplete
                value={selectedSkill}
                onChange={setSelectedSkill}
                label="Skill"
                placeholder="Search NICE skills..."
                disabled={!!editingSkill}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Proficiency</InputLabel>
                <Select
                  label="Proficiency"
                  value={newSkillProficiency}
                  onChange={(e) => setNewSkillProficiency(e.target.value)}
                >
                  <MenuItem value="beginner">Beginner</MenuItem>
                  <MenuItem value="intermediate">Intermediate</MenuItem>
                  <MenuItem value="expert">Expert</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Years of Experience"
                type="number"
                value={newSkillYears}
                onChange={(e) => setNewSkillYears(e.target.value)}
                placeholder="e.g., 3"
              />
            </Grid>
            {selectedSkill?.description && (
              <Grid size={12}>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                  {selectedSkill.description}
                </Typography>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSkillDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveSkill}
            disabled={!selectedSkill || isAddingSkill || isUpdatingSkill}
          >
            {editingSkill
              ? (isUpdatingSkill ? 'Saving...' : 'Save')
              : (isAddingSkill ? 'Adding...' : 'Add Skill')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Service Dialog (Add/Edit) */}
      <Dialog open={serviceDialogOpen} onClose={() => setServiceDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingService ? 'Edit Service Offering' : 'Add Service Offering'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={12}>
              <TextField
                fullWidth
                label="Service Title"
                placeholder="e.g., SOC 2 Readiness Assessment"
                value={newServiceTitle}
                onChange={(e) => setNewServiceTitle(e.target.value)}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={newServiceDescription}
                onChange={(e) => setNewServiceDescription(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  label="Category"
                  value={newServiceCategory}
                  onChange={(e) => setNewServiceCategory(e.target.value)}
                >
                  <MenuItem value="Assessors">Assessors</MenuItem>
                  <MenuItem value="Advisors">Advisors</MenuItem>
                  <MenuItem value="Agentic">Agentic</MenuItem>
                  <MenuItem value="SecOps">SecOps</MenuItem>
                  <MenuItem value="Training">Training</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Pricing Type</InputLabel>
                <Select
                  label="Pricing Type"
                  value={newServicePricingType}
                  onChange={(e) => setNewServicePricingType(e.target.value)}
                >
                  <MenuItem value="fixed">Fixed Price</MenuItem>
                  <MenuItem value="hourly">Hourly</MenuItem>
                  <MenuItem value="subscription">Subscription</MenuItem>
                  <MenuItem value="custom">Custom</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Price"
                type="number"
                value={newServicePrice}
                onChange={(e) => setNewServicePrice(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Delivery Time"
                placeholder="e.g., 2 weeks"
                value={newServiceDeliveryTime}
                onChange={(e) => setNewServiceDeliveryTime(e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setServiceDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveService}
            disabled={!newServiceTitle.trim() || !newServiceCategory || isAddingService}
          >
            {editingService
              ? 'Save'
              : (isAddingService ? 'Adding...' : 'Add Service')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Product Dialog (Add/Edit) */}
      <Dialog open={productDialogOpen} onClose={() => setProductDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingProduct ? 'Edit Product Experience' : 'Add Product Experience'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={12}>
              <ProductAutocomplete
                value={selectedProduct}
                onChange={setSelectedProduct}
                label="Product"
                placeholder="Search products..."
                disabled={!!editingProduct}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Proficiency</InputLabel>
                <Select
                  label="Proficiency"
                  value={newProductProficiency}
                  onChange={(e) => setNewProductProficiency(e.target.value)}
                >
                  <MenuItem value="beginner">Beginner</MenuItem>
                  <MenuItem value="intermediate">Intermediate</MenuItem>
                  <MenuItem value="expert">Expert</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Years of Experience"
                type="number"
                value={newProductYears}
                onChange={(e) => setNewProductYears(e.target.value)}
                placeholder="e.g., 3"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Certified?</InputLabel>
                <Select
                  label="Certified?"
                  value={newProductCertified ? 'yes' : 'no'}
                  onChange={(e) => setNewProductCertified(e.target.value === 'yes')}
                >
                  <MenuItem value="yes">Yes - Certified</MenuItem>
                  <MenuItem value="no">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Certification Details"
                value={newProductCertDetails}
                onChange={(e) => setNewProductCertDetails(e.target.value)}
                placeholder="e.g., AWS Solutions Architect"
                disabled={!newProductCertified}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProductDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveProduct}
            disabled={!selectedProduct || isAddingProduct || isUpdatingProduct}
          >
            {editingProduct
              ? (isUpdatingProduct ? 'Saving...' : 'Save')
              : (isAddingProduct ? 'Adding...' : 'Add Product')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Framework Dialog (Add/Edit) */}
      <Dialog open={frameworkDialogOpen} onClose={() => setFrameworkDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingFramework ? 'Edit Framework Experience' : 'Add Framework Experience'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={12}>
              <FrameworkAutocomplete
                value={selectedFramework}
                onChange={setSelectedFramework}
                label="Framework"
                placeholder="Search frameworks..."
                disabled={!!editingFramework}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Proficiency</InputLabel>
                <Select
                  label="Proficiency"
                  value={newFrameworkProficiency}
                  onChange={(e) => setNewFrameworkProficiency(e.target.value)}
                >
                  <MenuItem value="beginner">Beginner</MenuItem>
                  <MenuItem value="intermediate">Intermediate</MenuItem>
                  <MenuItem value="expert">Expert</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Years of Experience"
                type="number"
                value={newFrameworkYears}
                onChange={(e) => setNewFrameworkYears(e.target.value)}
                placeholder="e.g., 5"
              />
            </Grid>
            <Grid size={12}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Experience Types</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Chip
                  label="Assessor Certified"
                  onClick={() => setNewFrameworkAssessorCertified(!newFrameworkAssessorCertified)}
                  color={newFrameworkAssessorCertified ? 'success' : 'default'}
                  variant={newFrameworkAssessorCertified ? 'filled' : 'outlined'}
                  sx={{ cursor: 'pointer' }}
                />
                <Chip
                  label="Implementation"
                  onClick={() => setNewFrameworkImplementation(!newFrameworkImplementation)}
                  color={newFrameworkImplementation ? 'primary' : 'default'}
                  variant={newFrameworkImplementation ? 'filled' : 'outlined'}
                  sx={{ cursor: 'pointer' }}
                />
                <Chip
                  label="Audit"
                  onClick={() => setNewFrameworkAudit(!newFrameworkAudit)}
                  color={newFrameworkAudit ? 'primary' : 'default'}
                  variant={newFrameworkAudit ? 'filled' : 'outlined'}
                  sx={{ cursor: 'pointer' }}
                />
              </Box>
            </Grid>
            {selectedFramework?.description && (
              <Grid size={12}>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                  {selectedFramework.description}
                </Typography>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFrameworkDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveFramework}
            disabled={!selectedFramework || isAddingFramework || isUpdatingFramework}
          >
            {editingFramework
              ? (isUpdatingFramework ? 'Saving...' : 'Save')
              : (isAddingFramework ? 'Adding...' : 'Add Framework')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Segment Dialog (Add/Edit) */}
      <Dialog open={segmentDialogOpen} onClose={() => setSegmentDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingSegment ? 'Edit Market Segment' : 'Add Market Segment'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={12}>
              <SegmentAutocomplete
                value={selectedSegment}
                onChange={setSelectedSegment}
                label="Market Segment"
                placeholder="Search segments..."
                disabled={!!editingSegment}
              />
            </Grid>
            <Grid size={12}>
              <FormControl fullWidth>
                <InputLabel>Primary Segment?</InputLabel>
                <Select
                  label="Primary Segment?"
                  value={newSegmentIsPrimary ? 'yes' : 'no'}
                  onChange={(e) => setNewSegmentIsPrimary(e.target.value === 'yes')}
                >
                  <MenuItem value="yes">Yes - This is my primary market</MenuItem>
                  <MenuItem value="no">No - Secondary market</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {selectedSegment?.description && (
              <Grid size={12}>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                  {selectedSegment.description}
                </Typography>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSegmentDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveSegment}
            disabled={!selectedSegment || isAddingSegment || isUpdatingSegment}
          >
            {editingSegment
              ? (isUpdatingSegment ? 'Saving...' : 'Save')
              : (isAddingSegment ? 'Adding...' : 'Add Segment')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Service Segment Dialog (Add/Edit) - Professional service categories */}
      <Dialog open={serviceSegmentDialogOpen} onClose={() => setServiceSegmentDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingServiceSegment ? 'Edit Service Category' : 'Add Service Category'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={12}>
              <ServiceSegmentAutocomplete
                value={selectedServiceSegment}
                onChange={setSelectedServiceSegment}
                label="Service Category"
                placeholder="Search service categories..."
                disabled={!!editingServiceSegment}
              />
            </Grid>
            <Grid size={12}>
              <FormControl fullWidth>
                <InputLabel>Primary Category?</InputLabel>
                <Select
                  label="Primary Category?"
                  value={newServiceSegmentIsPrimary ? 'yes' : 'no'}
                  onChange={(e) => setNewServiceSegmentIsPrimary(e.target.value === 'yes')}
                >
                  <MenuItem value="yes">Yes - This is my primary service area</MenuItem>
                  <MenuItem value="no">No - Secondary service area</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {selectedServiceSegment?.description && (
              <Grid size={12}>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                  {selectedServiceSegment.description}
                </Typography>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setServiceSegmentDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveServiceSegment}
            disabled={!selectedServiceSegment || isAddingServiceSegment || isUpdatingServiceSegment}
          >
            {editingServiceSegment
              ? (isUpdatingServiceSegment ? 'Saving...' : 'Save')
              : (isAddingServiceSegment ? 'Adding...' : 'Add Category')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
