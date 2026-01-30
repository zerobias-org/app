'use client';

import { useState, useEffect } from 'react';
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
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useZeroBias } from '@/context/ZeroBiasContext';
import { useProfile, ProfileUpdateData } from '@/hooks/useProfile';

// Mock data still used for features not yet backed by Neon
const mockWorkRequests = [
  { id: '1', title: 'SOC 2 Type II Audit Support', status: 'in_progress', buyer: 'Acme Corp' },
  { id: '2', title: 'HIPAA Compliance Review', status: 'completed', buyer: 'HealthTech Inc' },
  { id: '3', title: 'Security Training Program', status: 'open', buyer: 'StartupXYZ' },
];

const mockReviews = [
  { id: '1', rating: 5, text: 'Excellent work on our SOC 2 audit. Very thorough and professional.', reviewer: 'John S.', date: '2024-01-10', approved: true },
  { id: '2', rating: 4, text: 'Great communication and delivered on time.', reviewer: 'Sarah M.', date: '2024-01-05', approved: true },
  { id: '3', rating: 5, text: 'Highly recommend for compliance work.', reviewer: 'Mike R.', date: '2023-12-20', approved: false },
];

export default function MyProfilePage() {
  const router = useRouter();
  const { user, org, loading } = useZeroBias();
  const {
    profile, isLoading: profileLoading, error: profileError,
    updateProfile, isUpdating,
    addSkill, isAddingSkill, deleteSkill,
    addService, isAddingService, deleteService,
  } = useProfile();

  // Profile form state
  const [headline, setHeadline] = useState('');
  const [about, setAbout] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [availabilityStatus, setAvailabilityStatus] = useState<'available' | 'busy' | 'unavailable'>('available');
  const [responseTime, setResponseTime] = useState('');
  const [profileDirty, setProfileDirty] = useState(false);

  // Skill dialog state
  const [skillDialogOpen, setSkillDialogOpen] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState('');
  const [newSkillProficiency, setNewSkillProficiency] = useState('intermediate');
  const [newSkillYears, setNewSkillYears] = useState('');

  // Service dialog state
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
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

  const approvedReviews = mockReviews.filter(r => r.approved);
  const avgRating = approvedReviews.length > 0
    ? approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length
    : 0;

  const workStats = {
    open: mockWorkRequests.filter(r => r.status === 'open').length,
    inProgress: mockWorkRequests.filter(r => r.status === 'in_progress').length,
    completed: mockWorkRequests.filter(r => r.status === 'completed').length,
  };

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

  const handleAddSkill = () => {
    if (!newSkillName.trim()) return;
    addSkill({
      skillName: newSkillName.trim(),
      skillCategory: newSkillCategory || undefined,
      proficiencyLevel: newSkillProficiency || undefined,
      yearsExperience: newSkillYears ? parseInt(newSkillYears) : undefined,
    });
    setSkillDialogOpen(false);
    setNewSkillName('');
    setNewSkillCategory('');
    setNewSkillProficiency('intermediate');
    setNewSkillYears('');
  };

  const handleAddService = () => {
    if (!newServiceTitle.trim() || !newServiceCategory || !newServicePricingType) return;
    addService({
      title: newServiceTitle.trim(),
      category: newServiceCategory,
      pricingType: newServicePricingType,
      description: newServiceDescription || undefined,
      price: newServicePrice || undefined,
      deliveryTime: newServiceDeliveryTime || undefined,
    });
    setServiceDialogOpen(false);
    setNewServiceTitle('');
    setNewServiceDescription('');
    setNewServiceCategory('');
    setNewServicePricingType('fixed');
    setNewServicePrice('');
    setNewServiceDeliveryTime('');
  };

  const markDirty = () => { if (!profileDirty) setProfileDirty(true); };

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
                  onClick={() => setSkillDialogOpen(true)}
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
                          {skill.skillName}
                          <Typography variant="caption" sx={{ opacity: 0.7 }}>
                            {skill.proficiencyLevel && ` · ${skill.proficiencyLevel}`}
                            {skill.yearsExperience && ` · ${skill.yearsExperience}y`}
                          </Typography>
                        </Box>
                      }
                      onDelete={() => deleteSkill(skill.id)}
                      color={skill.proficiencyLevel === 'expert' ? 'primary' : 'default'}
                      variant={skill.proficiencyLevel === 'expert' ? 'filled' : 'outlined'}
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
                  onClick={() => setServiceDialogOpen(true)}
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
                            <IconButton size="small">
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
                <Typography variant="h6" fontWeight={600}>
                  Reviews ({approvedReviews.length} approved)
                </Typography>
                <Button size="small" onClick={() => router.push('/my-profile/moderate-reviews')}>
                  Moderate Reviews
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />

              {approvedReviews.length === 0 ? (
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
                            {review.reviewer}
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {review.date}
                        </Typography>
                      </Box>
                      <Typography variant="body2">{review.text}</Typography>
                    </Paper>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Add Skill Dialog */}
      <Dialog open={skillDialogOpen} onClose={() => setSkillDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Skill</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={12}>
              <TextField
                fullWidth
                label="Skill Name"
                placeholder="e.g., SOC 2, HIPAA, ISO 27001"
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Category"
                placeholder="e.g., Compliance, GRC"
                value={newSkillCategory}
                onChange={(e) => setNewSkillCategory(e.target.value)}
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
            <Grid size={12}>
              <TextField
                fullWidth
                label="Years of Experience"
                type="number"
                value={newSkillYears}
                onChange={(e) => setNewSkillYears(e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSkillDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddSkill}
            disabled={!newSkillName.trim() || isAddingSkill}
          >
            {isAddingSkill ? 'Adding...' : 'Add Skill'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Service Dialog */}
      <Dialog open={serviceDialogOpen} onClose={() => setServiceDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Service Offering</DialogTitle>
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
            onClick={handleAddService}
            disabled={!newServiceTitle.trim() || !newServiceCategory || isAddingService}
          >
            {isAddingService ? 'Adding...' : 'Add Service'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
