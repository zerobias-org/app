'use client';

import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Divider,
  Chip,
  Rating,
  Paper,
  CircularProgress,
  LinearProgress,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useProfile } from '@/hooks/useProfile';

export default function ReviewsPage() {
  const router = useRouter();
  const { reviews, reviewsLoading } = useProfile();

  const approvedReviews = reviews.filter(r => r.approved);
  const pendingReviews = reviews.filter(r => !r.approved);

  // Calculate rating breakdown
  const ratingBreakdown = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: approvedReviews.filter(r => r.rating === rating).length,
    percentage: approvedReviews.length > 0
      ? (approvedReviews.filter(r => r.rating === rating).length / approvedReviews.length) * 100
      : 0,
  }));

  const avgRating = approvedReviews.length > 0
    ? approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length
    : 0;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Reviews Summary */}
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
          <Divider sx={{ mb: 3 }} />

          {reviewsLoading ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress size={32} />
              <Typography sx={{ mt: 2 }} color="text.secondary">
                Loading reviews...
              </Typography>
            </Box>
          ) : approvedReviews.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
              No approved reviews yet. Your reviews will appear here once buyers leave feedback.
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {/* Overall Rating */}
              <Box sx={{ textAlign: 'center', minWidth: 150 }}>
                <Typography variant="h2" fontWeight={600} color="primary">
                  {avgRating.toFixed(1)}
                </Typography>
                <Rating value={avgRating} readOnly precision={0.1} size="medium" />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Based on {approvedReviews.length} review{approvedReviews.length !== 1 ? 's' : ''}
                </Typography>
              </Box>

              {/* Rating Breakdown */}
              <Box sx={{ flex: 1, minWidth: 200 }}>
                {ratingBreakdown.map(({ rating, count, percentage }) => (
                  <Box key={rating} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="body2" sx={{ minWidth: 20 }}>
                      {rating}
                    </Typography>
                    <Rating value={1} max={1} readOnly size="small" />
                    <Box sx={{ flex: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={percentage}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: 'grey.200',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                          },
                        }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 30 }}>
                      {count}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Individual Reviews */}
      {!reviewsLoading && approvedReviews.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              All Reviews
            </Typography>
            <Divider sx={{ mb: 2 }} />

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
          </CardContent>
        </Card>
      )}

      {/* Pending Reviews Info */}
      {pendingReviews.length > 0 && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>
              Pending Reviews
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You have {pendingReviews.length} review{pendingReviews.length !== 1 ? 's' : ''} waiting for moderation.
              Click &quot;Moderate Reviews&quot; to approve or reject them.
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
