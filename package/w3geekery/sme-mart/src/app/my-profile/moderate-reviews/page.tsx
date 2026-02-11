'use client';

import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  Rating,
  CircularProgress,
  Alert,
  Divider,
  Paper,
  Tabs,
  Tab,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Undo as UndoIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useZeroBias } from '@/context/ZeroBiasContext';
import { useProfile } from '@/hooks/useProfile';

export default function ModerateReviewsPage() {
  const router = useRouter();
  const { user, loading } = useZeroBias();
  const { profile, isLoading: profileLoading, reviews, reviewsLoading, moderateReview, resetReviewToPending, isModerating } = useProfile();
  const [tab, setTab] = useState(0);

  if (loading || profileLoading || reviewsLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading reviews...</Typography>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography>Please sign in to moderate reviews.</Typography>
      </Container>
    );
  }

  const pendingReviews = reviews.filter((r) => !r.approved && !r.approvedBy);
  const approvedReviews = reviews.filter((r) => r.approved);
  const rejectedReviews = reviews.filter((r) => !r.approved && r.approvedBy);

  const tabReviews = tab === 0 ? pendingReviews : tab === 1 ? approvedReviews : rejectedReviews;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => router.push('/my-profile')}
        sx={{ mb: 2 }}
      >
        Back to Profile
      </Button>

      <Typography variant="h4" fontWeight={600} gutterBottom>
        Moderate Reviews
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Approve or reject reviews left on your profile. Only approved reviews are visible publicly.
      </Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              Pending
              {pendingReviews.length > 0 && (
                <Chip label={pendingReviews.length} size="small" color="warning" />
              )}
            </Box>
          }
        />
        <Tab label={`Approved (${approvedReviews.length})`} />
        <Tab label={`Rejected (${rejectedReviews.length})`} />
      </Tabs>

      {tabReviews.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            {tab === 0
              ? 'No pending reviews to moderate.'
              : tab === 1
                ? 'No approved reviews yet.'
                : 'No rejected reviews.'}
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {tabReviews.map((review) => (
            <Card key={review.id} variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Box>
                    <Rating value={review.rating} readOnly size="small" />
                    <Typography variant="caption" display="block" color="text.secondary">
                      By: {review.reviewerZerobiasUserId}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>

                {review.reviewText && (
                  <Typography variant="body2" sx={{ my: 1.5 }}>
                    {review.reviewText}
                  </Typography>
                )}

                {review.approvedAt && (
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                    {review.approved ? 'Approved' : 'Rejected'} on{' '}
                    {new Date(review.approvedAt).toLocaleDateString()}
                  </Typography>
                )}

                {/* Actions */}
                <Divider sx={{ my: 1.5 }} />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {/* Pending: Approve + Reject */}
                  {tab === 0 && (
                    <>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        startIcon={<ApproveIcon />}
                        onClick={() => moderateReview({ reviewId: review.id, approved: true })}
                        disabled={isModerating}
                      >
                        Approve
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<RejectIcon />}
                        onClick={() => moderateReview({ reviewId: review.id, approved: false })}
                        disabled={isModerating}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                  {/* Approved: Reject or Reset */}
                  {tab === 1 && (
                    <>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<RejectIcon />}
                        onClick={() => moderateReview({ reviewId: review.id, approved: false })}
                        disabled={isModerating}
                      >
                        Reject
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<UndoIcon />}
                        onClick={() => resetReviewToPending(review.id)}
                        disabled={isModerating}
                      >
                        Reset to Pending
                      </Button>
                    </>
                  )}
                  {/* Rejected: Approve or Reset */}
                  {tab === 2 && (
                    <>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        startIcon={<ApproveIcon />}
                        onClick={() => moderateReview({ reviewId: review.id, approved: true })}
                        disabled={isModerating}
                      >
                        Approve
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<UndoIcon />}
                        onClick={() => resetReviewToPending(review.id)}
                        disabled={isModerating}
                      >
                        Reset to Pending
                      </Button>
                    </>
                  )}
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Container>
  );
}
