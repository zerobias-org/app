'use client';

import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Rating,
  Divider,
  Button,
  CircularProgress,
} from '@mui/material';
import {
  WorkOutline as WorkIcon,
  CheckCircle as CheckCircleIcon,
  HourglassEmpty as PendingIcon,
} from '@mui/icons-material';
import Link from 'next/link';

interface WorkStats {
  draft?: number;
  open: number;
  inProgress: number;
  completed: number;
}

interface ProfileSidebarProps {
  user: {
    displayName?: string | null;
    email?: string | null;
  };
  org?: {
    displayName?: string | null;
    name?: string | null;
  } | null;
  profile?: {
    totalJobsCompleted?: number | null;
    hourlyRate?: string | null;
    ratingAverage?: string | null;
  } | null;
  reviewCount: number;
  avgRating: number;
  workStats: WorkStats;
  loading?: boolean;
}

export function ProfileSidebar({
  user,
  org,
  profile,
  reviewCount,
  avgRating,
  workStats,
  loading = false,
}: ProfileSidebarProps) {
  const initials = (user.displayName || user.email || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Profile Summary Card */}
      <Card>
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
              ({reviewCount} reviews)
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

      {/* Engagements Summary */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Engagements
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {workStats.draft != null && workStats.draft > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PendingIcon color="warning" fontSize="small" />
                <Typography variant="body2">Draft: {workStats.draft}</Typography>
              </Box>
            )}
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

          <Button
            component={Link}
            href="/engagements"
            fullWidth
            variant="outlined"
            sx={{ mt: 2 }}
            size="small"
          >
            View All Engagements
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}

export default ProfileSidebar;
