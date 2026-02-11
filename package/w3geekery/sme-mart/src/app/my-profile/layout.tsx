'use client';

import { useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useZeroBias } from '@/context/ZeroBiasContext';
import { useProfile } from '@/hooks/useProfile';
import { ProfileSidebar } from '@/components/profile';

const TAB_ROUTES = [
  {
    label: 'Overview',
    path: '/my-profile',
    title: 'My Profile',
    description: 'Manage your provider profile and public presence',
  },
  {
    label: 'Expertise',
    path: '/my-profile/expertise',
    title: 'Expertise',
    description: 'Add your roles, skills, frameworks, and certifications',
  },
  {
    label: 'Services',
    path: '/my-profile/services',
    title: 'Services',
    description: 'Manage your service offerings and packages',
  },
  {
    label: 'Reviews',
    path: '/my-profile/reviews',
    title: 'Reviews',
    description: 'View and respond to client reviews',
  },
];

export default function MyProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, org, loading } = useZeroBias();
  const { profile, isLoading: profileLoading, error: profileError, reviews } = useProfile();

  // Fetch engagements for current user
  const { data: engagementsData } = useQuery({
    queryKey: ['myEngagements', user?.id],
    queryFn: async () => {
      const response = await fetch('/api/engagements');
      if (!response.ok) throw new Error('Failed to fetch engagements');
      return response.json();
    },
    enabled: !!user,
  });

  const workStats = useMemo(() => {
    const engagements = engagementsData || [];
    return {
      draft: engagements.filter((r: { status: string }) => r.status === 'draft').length,
      open: engagements.filter((r: { status: string }) => r.status === 'open').length,
      inProgress: engagements.filter((r: { status: string }) => r.status === 'in_progress').length,
      completed: engagements.filter((r: { status: string }) => r.status === 'completed').length,
    };
  }, [engagementsData]);

  const approvedReviews = reviews.filter(r => r.approved);
  const avgRating = approvedReviews.length > 0
    ? approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length
    : 0;

  // Determine active tab from pathname
  const activeTab = useMemo(() => {
    // Check for exact match first, then prefix match for nested routes
    const exactIndex = TAB_ROUTES.findIndex(t => t.path === pathname);
    if (exactIndex !== -1) return exactIndex;

    // For nested routes like /my-profile/reviews/something
    const prefixIndex = TAB_ROUTES.findIndex(t =>
      t.path !== '/my-profile' && pathname.startsWith(t.path)
    );
    return prefixIndex !== -1 ? prefixIndex : 0;
  }, [pathname]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    router.push(TAB_ROUTES[newValue].path);
  };

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

  return (
    <Container maxWidth="lg" sx={{ pb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={600}>
          {TAB_ROUTES[activeTab].title}
        </Typography>
        <Typography color="text.secondary">
          {TAB_ROUTES[activeTab].description}
        </Typography>
      </Box>

      {profileError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load profile: {profileError.message}
        </Alert>
      )}

      {/* Tabs Navigation */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          {TAB_ROUTES.map((tab) => (
            <Tab key={tab.path} label={tab.label} />
          ))}
        </Tabs>
      </Box>

      {/* Main Content */}
      {activeTab === 0 ? (
        /* Overview tab: 2-column with sidebar */
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <ProfileSidebar
              user={user}
              org={org}
              profile={profile}
              reviewCount={approvedReviews.length}
              avgRating={avgRating}
              workStats={workStats}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            {children}
          </Grid>
        </Grid>
      ) : (
        /* Other tabs: full width */
        <Box>{children}</Box>
      )}
    </Container>
  );
}
