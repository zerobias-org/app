'use client';

import { useState } from 'react';
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
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  WorkOutline as WorkIcon,
  CheckCircle as CheckCircleIcon,
  HourglassEmpty as PendingIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useZeroBias } from '@/context/ZeroBiasContext';

// Mock data for skills
const mockSkills = [
  { id: '1', name: 'SOC 2', category: 'Compliance', proficiency: 'expert', years: 8 },
  { id: '2', name: 'ISO 27001', category: 'Compliance', proficiency: 'expert', years: 6 },
  { id: '3', name: 'HIPAA', category: 'Healthcare', proficiency: 'intermediate', years: 4 },
  { id: '4', name: 'Risk Assessment', category: 'GRC', proficiency: 'expert', years: 10 },
];

// Mock data for service offerings
const mockServices = [
  { id: '1', title: 'SOC 2 Readiness Assessment', price: 5000, pricingType: 'fixed', category: 'Assessors' },
  { id: '2', title: 'Compliance Gap Analysis', price: 150, pricingType: 'hourly', category: 'Advisors' },
  { id: '3', title: 'Security Policy Development', price: 3500, pricingType: 'fixed', category: 'Advisors' },
];

// Mock data for work requests
const mockWorkRequests = [
  { id: '1', title: 'SOC 2 Type II Audit Support', status: 'in_progress', buyer: 'Acme Corp' },
  { id: '2', title: 'HIPAA Compliance Review', status: 'completed', buyer: 'HealthTech Inc' },
  { id: '3', title: 'Security Training Program', status: 'open', buyer: 'StartupXYZ' },
];

// Mock data for reviews
const mockReviews = [
  { id: '1', rating: 5, text: 'Excellent work on our SOC 2 audit. Very thorough and professional.', reviewer: 'John S.', date: '2024-01-10', approved: true },
  { id: '2', rating: 4, text: 'Great communication and delivered on time.', reviewer: 'Sarah M.', date: '2024-01-05', approved: true },
  { id: '3', rating: 5, text: 'Highly recommend for compliance work.', reviewer: 'Mike R.', date: '2023-12-20', approved: false },
];

export default function MyProfilePage() {
  const router = useRouter();
  const { user, org, loading } = useZeroBias();
  const [skillDialogOpen, setSkillDialogOpen] = useState(false);
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography>Loading...</Typography>
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
  const avgRating = approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length;

  const workStats = {
    open: mockWorkRequests.filter(r => r.status === 'open').length,
    inProgress: mockWorkRequests.filter(r => r.status === 'in_progress').length,
    completed: mockWorkRequests.filter(r => r.status === 'completed').length,
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
                  <Typography variant="h6" fontWeight={600}>12</Typography>
                  <Typography variant="caption" color="text.secondary">Jobs Done</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" fontWeight={600}>$150</Typography>
                  <Typography variant="caption" color="text.secondary">Hourly Rate</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" fontWeight={600}>98%</Typography>
                  <Typography variant="caption" color="text.secondary">Success</Typography>
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
                    defaultValue={user.displayName || ''}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Headline"
                    defaultValue="Senior Compliance Consultant"
                    placeholder="e.g., SOC 2 Expert | ISO 27001 Lead Auditor"
                  />
                </Grid>
                <Grid size={12}>
                  <TextField
                    fullWidth
                    label="About"
                    multiline
                    rows={3}
                    defaultValue="Experienced compliance professional with 10+ years helping organizations achieve and maintain compliance certifications."
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Hourly Rate"
                    type="number"
                    defaultValue="150"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <FormControl fullWidth>
                    <InputLabel>Availability</InputLabel>
                    <Select defaultValue="available" label="Availability">
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
                    defaultValue="Within 24 hours"
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="contained" startIcon={<SaveIcon />}>
                  Save Profile
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

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {mockSkills.map((skill) => (
                  <Chip
                    key={skill.id}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {skill.name}
                        <Typography variant="caption" sx={{ opacity: 0.7 }}>
                          · {skill.proficiency} · {skill.years}y
                        </Typography>
                      </Box>
                    }
                    onDelete={() => {}}
                    color={skill.proficiency === 'expert' ? 'primary' : 'default'}
                    variant={skill.proficiency === 'expert' ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>
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
                    {mockServices.map((service) => (
                      <TableRow key={service.id}>
                        <TableCell>{service.title}</TableCell>
                        <TableCell>
                          <Chip label={service.category} size="small" />
                        </TableCell>
                        <TableCell>
                          ${service.price}{service.pricingType === 'hourly' ? '/hr' : ''}
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
              <TextField fullWidth label="Skill Name" placeholder="e.g., SOC 2, HIPAA, ISO 27001" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Category" placeholder="e.g., Compliance, GRC" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Proficiency</InputLabel>
                <Select label="Proficiency" defaultValue="intermediate">
                  <MenuItem value="beginner">Beginner</MenuItem>
                  <MenuItem value="intermediate">Intermediate</MenuItem>
                  <MenuItem value="expert">Expert</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={12}>
              <TextField fullWidth label="Years of Experience" type="number" />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSkillDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setSkillDialogOpen(false)}>Add Skill</Button>
        </DialogActions>
      </Dialog>

      {/* Add Service Dialog */}
      <Dialog open={serviceDialogOpen} onClose={() => setServiceDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Service Offering</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={12}>
              <TextField fullWidth label="Service Title" placeholder="e.g., SOC 2 Readiness Assessment" />
            </Grid>
            <Grid size={12}>
              <TextField fullWidth label="Description" multiline rows={3} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select label="Category" defaultValue="">
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
                <Select label="Pricing Type" defaultValue="fixed">
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
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Delivery Time" placeholder="e.g., 2 weeks" />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setServiceDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setServiceDialogOpen(false)}>Add Service</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
