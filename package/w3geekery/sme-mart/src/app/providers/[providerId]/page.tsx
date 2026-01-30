'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Avatar,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Rating,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
} from '@mui/material';
import {
  ArrowBack,
  AccessTime,
  Star,
  WorkOutline,
  AttachMoney,
} from '@mui/icons-material';
import { useZeroBias } from '@/context/ZeroBiasContext';

interface ProviderSkill {
  id: string;
  skillName: string;
  skillCategory: string | null;
  proficiencyLevel: 'beginner' | 'intermediate' | 'expert' | null;
  yearsExperience: number | null;
  verified: boolean | null;
}

interface ServiceOffering {
  id: string;
  title: string;
  description: string | null;
  category: string;
  pricingType: 'fixed' | 'hourly' | 'subscription' | 'custom';
  price: string | null;
  deliveryTime: string | null;
  includes: string[] | null;
  isActive: boolean | null;
}

interface Review {
  id: string;
  reviewerZerobiasUserId: string;
  rating: number;
  reviewText: string | null;
  createdAt: string;
}

interface ProviderDetail {
  id: string;
  slug: string;
  zerobiasUserId: string;
  displayName: string;
  headline: string | null;
  about: string | null;
  hourlyRate: string | null;
  availabilityStatus: 'available' | 'busy' | 'unavailable';
  responseTime: string | null;
  totalJobsCompleted: number;
  ratingAverage: string | null;
  skills: ProviderSkill[];
  serviceOfferings: ServiceOffering[];
  reviews: Review[];
}

const availabilityColors: Record<string, 'success' | 'warning' | 'default'> = {
  available: 'success',
  busy: 'warning',
  unavailable: 'default',
};

export default function ProviderDetailPage() {
  const { providerId } = useParams<{ providerId: string }>();
  const { user } = useZeroBias();
  const [provider, setProvider] = useState<ProviderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Review dialog state
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState<number | null>(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: '' });

  useEffect(() => {
    if (!providerId) return;

    fetch(`/api/providers/${providerId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Provider not found');
        return res.json();
      })
      .then((data) => {
        setProvider(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [providerId]);

  const handleSubmitReview = async () => {
    if (!reviewRating || !user) return;
    setReviewSubmitting(true);

    try {
      const res = await fetch(`/api/providers/${providerId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: reviewRating,
          reviewText: reviewText || null,
          reviewerZerobiasUserId: user.id,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit review');
      }

      setReviewOpen(false);
      setReviewRating(0);
      setReviewText('');
      setSnackbar({ open: true, message: 'Your review has been submitted for moderation.' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to submit review';
      setSnackbar({ open: true, message });
    } finally {
      setReviewSubmitting(false);
    }
  };

  const initials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 6, textAlign: 'center' }}>
        <CircularProgress size={40} />
      </Container>
    );
  }

  if (error || !provider) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Provider not found'}
        </Alert>
        <Button component={Link} href="/" startIcon={<ArrowBack />}>
          Back to Marketplace
        </Button>
      </Container>
    );
  }

  const activeServices = provider.serviceOfferings.filter((s) => s.isActive !== false);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Back link */}
      <Button component={Link} href="/" startIcon={<ArrowBack />} sx={{ mb: 3 }}>
        Back to Marketplace
      </Button>

      <Grid container spacing={4}>
        {/* Sidebar */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  fontSize: '1.8rem',
                  fontWeight: 700,
                  mx: 'auto',
                  mb: 2,
                  bgcolor: provider.availabilityStatus === 'available' ? 'primary.main' : 'grey.500',
                }}
              >
                {initials(provider.displayName)}
              </Avatar>

              <Typography variant="h5" fontWeight={700} gutterBottom>
                {provider.displayName}
              </Typography>

              {provider.headline && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {provider.headline}
                </Typography>
              )}

              <Chip
                label={provider.availabilityStatus}
                color={availabilityColors[provider.availabilityStatus]}
                size="small"
                sx={{ mb: 2, textTransform: 'capitalize' }}
              />

              <Divider sx={{ my: 2 }} />

              {/* Stats */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, textAlign: 'left' }}>
                {provider.ratingAverage && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Star fontSize="small" color="primary" />
                    <Typography variant="body2">
                      <strong>{provider.ratingAverage}</strong> rating
                    </Typography>
                  </Box>
                )}
                {provider.hourlyRate && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AttachMoney fontSize="small" color="primary" />
                    <Typography variant="body2">
                      <strong>${provider.hourlyRate}</strong>/hr
                    </Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WorkOutline fontSize="small" color="primary" />
                  <Typography variant="body2">
                    <strong>{provider.totalJobsCompleted}</strong> jobs completed
                  </Typography>
                </Box>
                {provider.responseTime && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccessTime fontSize="small" color="primary" />
                    <Typography variant="body2">
                      Responds {provider.responseTime.toLowerCase()}
                    </Typography>
                  </Box>
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Hire button */}
              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={() => setSnackbar({ open: true, message: 'Hiring flow coming soon!' })}
                sx={{ mb: 1 }}
              >
                Hire Me
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Main content */}
        <Grid size={{ xs: 12, md: 8 }}>
          {/* About */}
          {provider.about && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  About
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                  {provider.about}
                </Typography>
              </CardContent>
            </Card>
          )}

          {/* Skills */}
          {provider.skills.length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Skills & Expertise
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {provider.skills.map((skill) => (
                    <Chip
                      key={skill.id}
                      label={
                        `${skill.skillName}` +
                        (skill.proficiencyLevel ? ` (${skill.proficiencyLevel})` : '') +
                        (skill.yearsExperience ? ` · ${skill.yearsExperience}y` : '')
                      }
                      variant={skill.proficiencyLevel === 'expert' ? 'filled' : 'outlined'}
                      color={skill.proficiencyLevel === 'expert' ? 'primary' : 'default'}
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Service Offerings */}
          {activeServices.length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Service Offerings
                </Typography>
                <Grid container spacing={2}>
                  {activeServices.map((service) => (
                    <Grid size={{ xs: 12, sm: 6 }} key={service.id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {service.title}
                          </Typography>
                          <Chip
                            label={service.category}
                            size="small"
                            color="secondary"
                            variant="outlined"
                            sx={{ mt: 0.5, mb: 1 }}
                          />
                          {service.description && (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              {service.description}
                            </Typography>
                          )}
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {service.price && (
                              <Chip
                                label={
                                  service.pricingType === 'hourly'
                                    ? `$${service.price}/hr`
                                    : `$${Number(service.price).toLocaleString()} ${service.pricingType}`
                                }
                                size="small"
                              />
                            )}
                            {service.deliveryTime && (
                              <Chip label={service.deliveryTime} size="small" variant="outlined" />
                            )}
                          </Box>
                          {service.includes && service.includes.length > 0 && (
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="caption" color="text.secondary">
                                Includes:
                              </Typography>
                              <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                                {service.includes.map((item, i) => (
                                  <li key={i}>
                                    <Typography variant="caption">{item}</Typography>
                                  </li>
                                ))}
                              </ul>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* Reviews */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                  Reviews
                </Typography>
                {user && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setReviewOpen(true)}
                  >
                    Leave a Review
                  </Button>
                )}
              </Box>

              {provider.reviews.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No reviews yet. Be the first to leave a review!
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {provider.reviews.map((review) => (
                    <Box key={review.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Rating value={review.rating} readOnly size="small" />
                        <Typography variant="caption" color="text.secondary">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                      {review.reviewText && (
                        <Typography variant="body2">{review.reviewText}</Typography>
                      )}
                      <Divider sx={{ mt: 1.5 }} />
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Review Dialog */}
      <Dialog open={reviewOpen} onClose={() => setReviewOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Leave a Review</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Box>
              <Typography variant="body2" gutterBottom>
                Rating
              </Typography>
              <Rating
                value={reviewRating}
                onChange={(_, value) => setReviewRating(value)}
                size="large"
              />
            </Box>
            <TextField
              label="Review (optional)"
              multiline
              rows={4}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share your experience working with this provider..."
            />
            <Alert severity="info" variant="outlined">
              Reviews are moderated and will appear after approval.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmitReview}
            disabled={!reviewRating || reviewSubmitting}
          >
            {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Container>
  );
}
